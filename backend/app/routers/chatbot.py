from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Header, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import UUID
import os
import asyncio

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, ChatbotSession, ChatbotMessage, ChatbotDocument
from app.schemas import (
    ChatbotSessionCreate, ChatbotSession as ChatbotSessionSchema,
    ChatbotSessionList as ChatbotSessionListSchema,
    ChatbotMessageCreate, ChatbotMessage as ChatbotMessageSchema
)
from app.services.context_manager import ContextManagerService
from app.services.llm import stream_chat_response, analyze_image
from app.config import settings
from datetime import datetime, timezone
import json

router = APIRouter(
    prefix="/api/chatbot",
    tags=["Chatbot"]
)

@router.get("/sessions", response_model=list[ChatbotSessionListSchema])
def get_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieve all chatbot sessions for the current user."""
    return db.query(ChatbotSession).filter(ChatbotSession.user_id == current_user.id).order_by(ChatbotSession.updated_at.desc()).all()

@router.post("/sessions", response_model=ChatbotSessionSchema)
def create_session(session_data: ChatbotSessionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new chatbot session."""
    db_session = ChatbotSession(
        user_id=current_user.id,
        title=session_data.title,
        language=session_data.language,
        mode=session_data.mode
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session
@router.get("/sessions/{session_id}", response_model=ChatbotSessionSchema)
def get_session(session_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieve a specific chatbot session."""
    session = db.query(ChatbotSession).filter(ChatbotSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return session

@router.delete("/sessions/{session_id}")
def delete_session(session_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete a specific chatbot session."""
    session = db.query(ChatbotSession).filter(ChatbotSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    db.delete(session)
    db.commit()
    return {"status": "success", "message": "Session deleted"}
@router.get("/sessions/{session_id}/messages", response_model=list[ChatbotMessageSchema])
def get_messages(session_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieve all messages for a specific session."""
    session = db.query(ChatbotSession).filter(ChatbotSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    return db.query(ChatbotMessage).filter(ChatbotMessage.session_id == session_id).order_by(ChatbotMessage.timestamp.asc()).all()


async def stream_and_save_response(session_id: UUID, messages_payload: list, request: Request = None):
    """
    Generator that consumes the SSE chunks, yields them to the client,
    and accumulates the full text to save as an assistant message.
    """
    from app.database import SessionLocal
    full_response = ""
    has_error = False
    
    has_saved = False
    
    try:
        async for sse_chunk in stream_chat_response(messages_payload, request=request):
            if request and await request.is_disconnected():
                raise asyncio.CancelledError()
            
            yield sse_chunk
            if sse_chunk.startswith("data: ") and not sse_chunk.startswith("data: [DONE]"):
                try:
                    data = json.loads(sse_chunk[6:].strip())
                    if "content" in data:
                        full_response += data["content"]
                    if "error" in data:
                        has_error = True
                except json.JSONDecodeError:
                    pass
    except asyncio.CancelledError:
        # Client intentionally stopped generation
        # We catch this cleanly and proceed to the finally/persistence block
        pass
    except Exception as e:
        has_error = True
        raise e
    finally:
        if not has_saved:
            has_saved = True
            # Save the accumulated response to the database
            with SessionLocal() as db_session:
                # User requested: if stopped intentionally (CancelledError implies this on stream drop)
                # we still preserve partial text as completed. 
                # But if it's completely blank, we just don't save the blank assistant message.
                if full_response.strip() == "":
                    pass # Do not save blank assistant message, leave user message unanswered
                else:
                    status = "failed" if has_error else "completed"
                    assistant_msg = ChatbotMessage(
                        session_id=session_id,
                        role="assistant",
                        content=full_response,
                        status=status
                    )
                    db_session.add(assistant_msg)
                    db_session.commit()

from fastapi import BackgroundTasks

def trigger_summarization(session_id: str):
    from app.database import SessionLocal
    with SessionLocal() as db:
        ContextManagerService.check_and_summarize(db, session_id)


@router.get("/test-stream")
async def test_stream():
    async def generator():
        yield "ONE\n\n"
        await asyncio.sleep(1)
        yield "TWO\n\n"
        await asyncio.sleep(1)
        yield "THREE\n\n"
        
    return StreamingResponse(
        generator(),
        media_type="text/event-stream"
    )

@router.post("/sessions/{session_id}/chat")
async def chat_stream(
    request: Request,
    session_id: UUID, 
    message_data: ChatbotMessageCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Core streaming endpoint.
    """
    session = db.query(ChatbotSession).filter(ChatbotSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # 1. Save User Message
    user_msg = ChatbotMessage(
        session_id=session_id,
        role="user",
        content=message_data.content,
        status="completed"
    )
    db.add(user_msg)
    
    if db.query(ChatbotMessage).filter(ChatbotMessage.session_id == session_id).count() == 0:
        session.title = message_data.content[:30] + ("..." if len(message_data.content) > 30 else "")
    
    if message_data.language:
        session.language = message_data.language
    if message_data.mode:
        session.mode = message_data.mode

    session.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()

    # 2. Build Payload
    messages_payload = ContextManagerService.build_messages_payload(db, str(session_id), message_data.content)

    # 3. Stream Response and trigger summarization check after stream
    background_tasks.add_task(trigger_summarization, str(session_id))
    
    return StreamingResponse(
        stream_and_save_response(session_id, messages_payload), 
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.post("/sessions/{session_id}/chat/retry")
async def chat_retry(
    request: Request,
    session_id: UUID, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Retry endpoint. Finds the last user message and re-streams the response without creating a duplicate user message.
    """
    session = db.query(ChatbotSession).filter(ChatbotSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    last_user_message = (
        db.query(ChatbotMessage)
        .filter(ChatbotMessage.session_id == session_id, ChatbotMessage.role == "user")
        .order_by(ChatbotMessage.timestamp.desc())
        .first()
    )
    
    if not last_user_message:
        raise HTTPException(status_code=400, detail="No user message found to retry.")
        
    # Build payload using the existing user message content
    messages_payload = ContextManagerService.build_messages_payload(db, str(session_id), last_user_message.content)

    # Stream Response and trigger summarization check after stream
    background_tasks.add_task(trigger_summarization, str(session_id))
    return StreamingResponse(
        stream_and_save_response(session_id, messages_payload), 
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.post("/sessions/{session_id}/upload")
async def upload_document(session_id: UUID, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Uploads a document, extracts text, summarizes it, and associates it with the chat session.
    """
    session = db.query(ChatbotSession).filter(ChatbotSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [".pdf", ".docx", ".txt"]
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {', '.join(allowed_exts)}")

    content = await file.read()
    
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File is empty.")
    
    max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_size_bytes:
        raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE_MB}MB.")

    from app.services.document_service import extract_text_from_file, summarize_document
    import time
    import logging

    logger = logging.getLogger(__name__)

    start_time = time.time()
    try:
        extracted_text = extract_text_from_file(content, file.filename)
    except Exception as e:
        logger.error(f"Document extraction failed for {file.filename}: {e}")
        raise HTTPException(status_code=422, detail="Failed to read or extract text from document. It may be corrupted or unsupported.")
        
    if not extracted_text or not extracted_text.strip():
        raise HTTPException(status_code=422, detail="No readable text found in document.")
        
    summary = summarize_document(extracted_text, file.filename)
    duration_ms = int((time.time() - start_time) * 1000)

    # Save to database
    doc = ChatbotDocument(
        session_id=session_id,
        filename=file.filename,
        mime_type=file.content_type,
        file_size=len(content),
        extracted_text=extracted_text,
        summary=summary,
        processing_status="completed",
        processing_duration_ms=duration_ms
    )
    db.add(doc)
    
    # Optionally add a system message to the chat indicating a file was uploaded
    system_msg = ChatbotMessage(
        session_id=session_id,
        role="system",
        content=f"Document '{file.filename}' uploaded and analyzed successfully.",
        status="completed"
    )
    db.add(system_msg)
    
    db.commit()
    db.refresh(doc)
    
    return doc

@router.get("/sessions/{session_id}/documents")
async def get_session_documents(session_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ChatbotSession).filter(ChatbotSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    return db.query(ChatbotDocument).filter(ChatbotDocument.session_id == session_id).order_by(ChatbotDocument.upload_time.desc()).all()

@router.delete("/sessions/{session_id}/documents/{doc_id}")
async def delete_document(session_id: UUID, doc_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ChatbotSession).filter(ChatbotSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    doc = db.query(ChatbotDocument).filter(ChatbotDocument.id == doc_id, ChatbotDocument.session_id == session_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    db.delete(doc)
    
    # Optionally add a system message
    system_msg = ChatbotMessage(
        session_id=session_id,
        role="system",
        content=f"Document '{doc.filename}' was removed from the context.",
        status="completed"
    )
    db.add(system_msg)
    
    db.commit()
    return {"status": "success", "message": "Document deleted"}
