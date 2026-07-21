from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import UUID
import os

from app.database import get_db
from app.models import User, ChatbotSession, ChatbotMessage, ChatbotDocument
from app.schemas import (
    ChatbotSessionCreate, ChatbotSession as ChatbotSessionSchema,
    ChatbotMessageCreate, ChatbotMessage as ChatbotMessageSchema
)
from app.services.context_manager import ContextManagerService
from app.services.llm import stream_chat_response, analyze_image
from app.config import settings
from datetime import datetime
import json

router = APIRouter(
    prefix="/api/chatbot",
    tags=["Chatbot"]
)

def get_user_from_header(db: Session, x_user_id: str = Header(None, alias="X-User-Id")):
    if x_user_id and x_user_id.isdigit():
        user = db.query(User).filter(User.id == int(x_user_id)).first()
        if user:
            return user
    # Fallback to first user for development like appointments.py
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found in database.")
    return user


@router.get("/sessions", response_model=list[ChatbotSessionSchema])
def get_sessions(db: Session = Depends(get_db), x_user_id: str = Header(None, alias="X-User-Id")):
    """Retrieve all chatbot sessions for the current user."""
    user = get_user_from_header(db, x_user_id)
    return db.query(ChatbotSession).filter(ChatbotSession.user_id == user.id).order_by(ChatbotSession.updated_at.desc()).all()

@router.post("/sessions", response_model=ChatbotSessionSchema)
def create_session(session_data: ChatbotSessionCreate, db: Session = Depends(get_db), x_user_id: str = Header(None, alias="X-User-Id")):
    """Create a new chatbot session."""
    user = get_user_from_header(db, x_user_id)
    db_session = ChatbotSession(
        user_id=user.id,
        title=session_data.title,
        language=session_data.language,
        mode=session_data.mode
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/sessions/{session_id}/messages", response_model=list[ChatbotMessageSchema])
def get_messages(session_id: UUID, db: Session = Depends(get_db), x_user_id: str = Header(None, alias="X-User-Id")):
    """Retrieve all messages for a specific session."""
    user = get_user_from_header(db, x_user_id)
    session = db.query(ChatbotSession).filter(ChatbotSession.id == session_id, ChatbotSession.user_id == user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return db.query(ChatbotMessage).filter(ChatbotMessage.session_id == session_id).order_by(ChatbotMessage.timestamp.asc()).all()


async def stream_and_save_response(session_id: UUID, messages_payload: list):
    """
    Generator that consumes the SSE chunks, yields them to the client,
    and accumulates the full text to save as an assistant message.
    """
    from app.database import SessionLocal
    full_response = ""
    
    async for sse_chunk in stream_chat_response(messages_payload):
        yield sse_chunk
        if sse_chunk.startswith("data: ") and not sse_chunk.startswith("data: [DONE]"):
            try:
                data = json.loads(sse_chunk[6:].strip())
                if "content" in data:
                    full_response += data["content"]
            except json.JSONDecodeError:
                pass
                
    # Save the accumulated response to the database
    with SessionLocal() as db_session:
        assistant_msg = ChatbotMessage(
            session_id=session_id,
            role="assistant",
            content=full_response,
            status="completed"
        )
        db_session.add(assistant_msg)
        db_session.commit()

@router.post("/sessions/{session_id}/chat")
async def chat_stream(session_id: UUID, message_data: ChatbotMessageCreate, db: Session = Depends(get_db), x_user_id: str = Header(None, alias="X-User-Id")):
    """
    Core streaming endpoint.
    """
    user = get_user_from_header(db, x_user_id)
    session = db.query(ChatbotSession).filter(ChatbotSession.id == session_id, ChatbotSession.user_id == user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
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

    session.updated_at = datetime.utcnow()
    db.commit()

    # 2. Build Payload
    messages_payload = ContextManagerService.build_messages_payload(db, str(session_id), message_data.content)

    # 3. Stream Response
    return StreamingResponse(stream_and_save_response(session_id, messages_payload), media_type="text/event-stream")

@router.post("/sessions/{session_id}/upload")
async def upload_document(session_id: UUID, file: UploadFile = File(...), db: Session = Depends(get_db), x_user_id: str = Header(None, alias="X-User-Id")):
    """
    Uploads a document, extracts text, summarizes it, and associates it with the chat session.
    """
    user = get_user_from_header(db, x_user_id)
    session = db.query(ChatbotSession).filter(ChatbotSession.id == session_id, ChatbotSession.user_id == user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [".pdf", ".docx", ".txt"]
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {', '.join(allowed_exts)}")

    content = await file.read()
    
    # Check max file size (e.g., 10MB)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")

    from app.services.document_service import extract_text_from_file, summarize_document
    import time

    start_time = time.time()
    try:
        extracted_text = extract_text_from_file(content, file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {str(e)}")
        
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
async def get_session_documents(session_id: UUID, db: Session = Depends(get_db), x_user_id: str = Header(None, alias="X-User-Id")):
    user = get_user_from_header(db, x_user_id)
    session = db.query(ChatbotSession).filter(ChatbotSession.id == session_id, ChatbotSession.user_id == user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return db.query(ChatbotDocument).filter(ChatbotDocument.session_id == session_id).order_by(ChatbotDocument.upload_time.desc()).all()

@router.delete("/sessions/{session_id}/documents/{doc_id}")
async def delete_document(session_id: UUID, doc_id: UUID, db: Session = Depends(get_db), x_user_id: str = Header(None, alias="X-User-Id")):
    user = get_user_from_header(db, x_user_id)
    session = db.query(ChatbotSession).filter(ChatbotSession.id == session_id, ChatbotSession.user_id == user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
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
