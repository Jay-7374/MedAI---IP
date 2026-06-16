import os
import random
from datetime import datetime
from fastapi import FastAPI, HTTPException, status, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional

from app.config import settings
from app.database import engine, SessionLocal, Base, get_db
from app import models, schemas, crud
from app.services.voice_bot import process_voice_turn, DEFAULT_PROMPTS
from app.services.tts import get_tts_audio_url

app = FastAPI(title="MedAI Fullstack GenAI Voice Bot API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Seeding and Table Initialization
@app.on_event("startup")
def startup_db_seeding():
    if engine is not None:
        try:
            # Initialize tables
            Base.metadata.create_all(bind=engine)
            print("Database tables initialized.")
            
            # Seed default templates
            db = SessionLocal()
            for bot_name, system_prompt in DEFAULT_PROMPTS.items():
                crud.create_or_update_prompt_template(
                    db,
                    schemas.PromptTemplateCreate(bot_name=bot_name, system_prompt=system_prompt)
                )
            
            # Seed default patient user
            if not crud.get_user_by_email(db, "patient@medai.com"):
                crud.create_user(
                    db,
                    schemas.UserCreate(name="Alex Mercer", email="patient@medai.com", role="Patient")
                )
            db.close()
            print("Database seeded successfully.")
        except Exception as e:
            print(f"Error initializing/seeding database: {e}")

# ==================== LEGACY / FRONTEND PAGES COMPATIBILITY ====================
appointments_db = [
    { "id": "A101", "doctor": "Dr. Evelyn Reed", "specialty": "Cardiology", "date": "2026-06-18", "time": "10:30 AM", "status": "Confirmed" },
    { "id": "A102", "doctor": "Dr. Marcus Vance", "specialty": "Neurology", "date": "2026-06-22", "time": "02:15 PM", "status": "Pending" }
]

medicines_db = [
    { "id": 1, "name": "Lisinopril", "dosage": "10mg", "time": "08:00 AM", "freq": "Once Daily", "status": "Taken" },
    { "id": 2, "name": "Metformin", "dosage": "500mg", "time": "13:00 PM", "freq": "Twice Daily", "status": "Pending" }
]

@app.post("/api/auth/login")
def login(request: schemas.UserCreate):
    return {
        "status": "success",
        "message": "Authorization validation passed. Initializing session...",
        "user": { "name": request.name, "role": request.role }
    }

@app.get("/api/telemetry")
def get_telemetry():
    heartrate = random.randint(70, 78)
    spo2 = random.randint(97, 99)
    return {
        "heartrate": heartrate,
        "spo2": spo2,
        "blood_pressure": "120/80",
        "temperature": "36.7"
    }

@app.get("/api/appointments")
def get_appointments():
    return appointments_db

@app.post("/api/appointments")
def add_appointment(req: dict):
    doctor_mapping = {
        "Dr. Reed": ("Dr. Evelyn Reed", "Cardiology"),
        "Dr. Vance": ("Dr. Marcus Vance", "Neurology"),
        "Dr. Foster": ("Dr. Sarah Foster", "Pediatrics")
    }
    doctor_name, specialty = doctor_mapping.get(req.get("doctor"), (req.get("doctor"), "General Practice"))
    new_id = f"A{100 + len(appointments_db) + 1}"
    new_appointment = {
        "id": new_id,
        "doctor": doctor_name,
        "specialty": specialty,
        "date": req.get("date"),
        "time": req.get("time"),
        "status": "Pending",
        "symptoms": req.get("symptoms", "")
    }
    appointments_db.append(new_appointment)
    return new_appointment

@app.get("/api/medicines")
def get_medicines():
    return medicines_db

@app.post("/api/medicines")
def add_medicine(req: dict):
    new_id = len(medicines_db) + 1
    new_med = {
        "id": new_id,
        "name": req.get("name"),
        "dosage": req.get("dosage"),
        "time": req.get("time"),
        "freq": "Once Daily",
        "status": "Pending"
    }
    medicines_db.append(new_med)
    return new_med

@app.delete("/api/medicines/{name}")
def delete_medicine(name: str):
    global medicines_db
    initial_len = len(medicines_db)
    medicines_db = [m for m in medicines_db if m["name"].lower() != name.lower()]
    if len(medicines_db) == initial_len:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return {"status": "success", "message": f"Medicine {name} removed."}

@app.post("/api/emergency/sos")
def trigger_sos():
    return {
        "status": "success",
        "message": "CRITICAL SIGNAL BROADCASTING: GPS coordinates and real-time medical vectors routed to first response units.",
        "dispatch": {
            "status": "Dispatched",
            "unit": "Ambulance Unit #4B",
            "eta_minutes": 7,
            "timestamp": datetime.utcnow().isoformat()
        }
    }

# ==================== VOICE BOT CORE APIs ====================

@app.post("/api/users", response_model=schemas.User)
def create_or_get_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, user.email)
    if not db_user:
        db_user = crud.create_user(db, user)
    return db_user

@app.post("/api/sessions", response_model=schemas.CallSession)
def create_session(session: schemas.CallSessionCreate, db: Session = Depends(get_db)):
    db_session = crud.get_session(db, session.id)
    if not db_session:
        db_session = crud.create_session(db, session)
    return db_session

@app.get("/api/sessions/{session_id}/transcripts", response_model=List[schemas.Transcript])
def get_session_transcripts(session_id: str, db: Session = Depends(get_db)):
    return crud.get_transcripts_by_session(db, session_id)

@app.get("/api/prompts", response_model=List[schemas.PromptTemplate])
def get_all_prompts(db: Session = Depends(get_db)):
    return db.query(models.PromptTemplate).all()

@app.post("/api/prompts", response_model=schemas.PromptTemplate)
def create_or_update_prompt(prompt: schemas.PromptTemplateCreate, db: Session = Depends(get_db)):
    return crud.create_or_update_prompt_template(db, prompt)

@app.post("/api/voice/turn")
def voice_turn(session_id: str, user_text: str, bot_name: str = "General", db: Session = Depends(get_db)):
    """
    HTTP route for processing a single user voice turn.
    Saves input/output in database, and returns TTS audio link.
    """
    start_time = datetime.utcnow()
    
    # 1. Save User Statement
    crud.create_transcript(
        db,
        schemas.TranscriptCreate(
            session_id=session_id,
            speaker="User",
            text=user_text
        )
    )
    
    # 2. Process LLM Dialog
    ai_response = process_voice_turn(db, session_id, user_text, bot_name)
    
    # Calculate response duration
    latency = int((datetime.utcnow() - start_time).total_seconds() * 1000)
    
    # 3. Save AI Statement
    crud.create_transcript(
        db,
        schemas.TranscriptCreate(
            session_id=session_id,
            speaker="AI",
            text=ai_response,
            latency_ms=latency
        )
    )
    
    # 4. Generate direct TTS audio URL
    audio_url = get_tts_audio_url(ai_response)
    
    return {
        "user_text": user_text,
        "ai_response": ai_response,
        "audio_url": audio_url,
        "latency_ms": latency
    }

# ==================== WEBSOCKET STREAMING LOOP ====================

@app.websocket("/ws/voice")
async def websocket_voice_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket voice client connected.")
    
    db = SessionLocal()
    try:
        while True:
            # Receive text payload from frontend voice engine
            data = await websocket.receive_json()
            msg_type = data.get("type")
            
            if msg_type == "text":
                session_id = data.get("session_id")
                user_text = data.get("text")
                bot_name = data.get("bot_name", "General")
                
                if not session_id or not user_text:
                    await websocket.send_json({"error": "Missing session_id or text payload."})
                    continue
                
                start_time = datetime.utcnow()
                
                # 1. Store User Statement
                crud.create_transcript(
                    db,
                    schemas.TranscriptCreate(
                        session_id=session_id,
                        speaker="User",
                        text=user_text
                    )
                )
                
                # 2. Get LLM response
                ai_response = process_voice_turn(db, session_id, user_text, bot_name)
                
                latency = int((datetime.utcnow() - start_time).total_seconds() * 1000)
                
                # 3. Store AI Response
                crud.create_transcript(
                    db,
                    schemas.TranscriptCreate(
                        session_id=session_id,
                        speaker="AI",
                        text=ai_response,
                        latency_ms=latency
                    )
                )
                
                # 4. Build TTS Streaming link
                audio_url = get_tts_audio_url(ai_response)
                
                # Send text and audio URL back to the client
                await websocket.send_json({
                    "speaker": "AI",
                    "text": ai_response,
                    "audio_url": audio_url,
                    "latency_ms": latency
                })
    except WebSocketDisconnect:
        print("WebSocket client disconnected.")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        db.close()

# Serving static frontend files (React built bundle first, fallback to source)
# Trigger auto-reload for built frontend dist
frontend_path = "../frontend/dist"
if not os.path.exists(frontend_path):
    frontend_path = "frontend/dist"
if not os.path.exists(frontend_path):
    frontend_path = "../frontend"
if not os.path.exists(frontend_path):
    frontend_path = "frontend"

if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")