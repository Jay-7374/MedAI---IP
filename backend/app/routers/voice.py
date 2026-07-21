from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db, SessionLocal
from app import schemas, crud
from app.services.voice_bot import process_voice_turn
from app.services.tts import get_tts_audio_url
import json

router = APIRouter(tags=["voice-bot"])

@router.post("/api/users", response_model=schemas.User, summary="Create or retrieve a user by email")
def create_or_get_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, user.email)
    if not db_user:
        db_user = crud.create_user(db, user)
    return db_user

@router.post("/api/sessions", response_model=schemas.CallSession, summary="Create or retrieve a call session by ID")
def create_session(session: schemas.CallSessionCreate, db: Session = Depends(get_db)):
    db_session = crud.get_session(db, session.id)
    if not db_session:
        db_session = crud.create_session(db, session)
    return db_session

@router.get("/api/sessions/{session_id}/transcripts", response_model=List[schemas.Transcript], summary="Get all transcript turns for a call session")
def get_session_transcripts(session_id: str, db: Session = Depends(get_db)):
    return crud.get_transcripts_by_session(db, session_id)

@router.post("/api/voice/turn", summary="Process a single voice turn via HTTP")
def voice_turn(session_id: str, user_text: str, bot_name: str = "General", db: Session = Depends(get_db)):
    start_time = datetime.utcnow()
    crud.create_transcript(db, schemas.TranscriptCreate(session_id=session_id, speaker="User", text=user_text))
    
    ai_response = process_voice_turn(db, session_id, user_text, bot_name)
    latency = int((datetime.utcnow() - start_time).total_seconds() * 1000)
    
    crud.create_transcript(db, schemas.TranscriptCreate(session_id=session_id, speaker="AI", text=ai_response, latency_ms=latency))
    audio_url = get_tts_audio_url(ai_response)
    
    return {
        "user_text": user_text,
        "ai_response": ai_response,
        "audio_url": audio_url,
        "latency_ms": latency,
    }

@router.websocket("/ws/voice")
async def websocket_voice_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket voice client connected.")
    db = None
    try:
        if SessionLocal is not None:
            db = SessionLocal()
    except Exception as e:
        print(f"DB session unavailable (Supabase down), running without DB: {e}")
        db = None
    try:
        while True:
            data_str = await websocket.receive_text()
            data = json.loads(data_str)
            
            if data.get("type") == "text":
                session_id = data.get("session_id", "unknown")
                user_text = data.get("text", "")
                bot_name = data.get("bot_name", "NaturalSpeechAuth")
                
                # Save user transcript (skip if DB unavailable)
                if db is not None:
                    try:
                        crud.create_transcript(db, schemas.TranscriptCreate(session_id=session_id, speaker="User", text=user_text))
                    except Exception as e:
                        print(f"Skipping DB save (Supabase down): {e}")
                
                start_time = datetime.utcnow()
                ai_response = process_voice_turn(db, session_id, user_text, bot_name)
                latency = int((datetime.utcnow() - start_time).total_seconds() * 1000)
                
                # Save AI transcript (skip if DB unavailable)
                if db is not None:
                    try:
                        crud.create_transcript(db, schemas.TranscriptCreate(session_id=session_id, speaker="AI", text=ai_response, latency_ms=latency))
                    except Exception:
                        pass
                
                audio_url = get_tts_audio_url(ai_response)
                
                response_payload = {
                    "type": "text",
                    "text": ai_response,
                    "latency_ms": latency,
                    "audio_url": audio_url
                }
                await websocket.send_json(response_payload)
                
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"Error in websocket: {e}")
    finally:
        if db is not None:
            db.close()
