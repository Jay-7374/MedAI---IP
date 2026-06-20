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
    import os
    if engine is not None:
        try:
            # Drop and recreate local SQLite database to apply password schema changes cleanly
            db_path = "medai.db"
            if os.path.exists(db_path):
                try:
                    os.remove(db_path)
                    print("Cleared old SQLite database to apply password schema.")
                except Exception as ex:
                    print(f"Could not remove medai.db: {ex}")

            Base.metadata.create_all(bind=engine)
            print("Database tables initialized.")
            
            # Seed default templates
            db = SessionLocal()
            # Clear old templates first
            db.query(models.PromptTemplate).delete()
            db.commit()
            
            for bot_name, system_prompt in DEFAULT_PROMPTS.items():
                crud.create_or_update_prompt_template(
                    db,
                    schemas.PromptTemplateCreate(bot_name=bot_name, system_prompt=system_prompt)
                )
            
            # Seed default patient user with password credentials
            if not crud.get_user_by_email(db, "patient@medai.com"):
                crud.create_user(
                    db,
                    schemas.UserCreate(name="Alex Mercer", email="patient@medai.com", password="123456", role="Patient")
                )
            db.close()
            print("Database seeded successfully with password authentication and templates.")
        except Exception as e:
            print(f"Error initializing/seeding database: {e}")

# ==================== LEGACY / FRONTEND PAGES COMPATIBILITY ====================
appointments_db = [
    { "id": "A101", "doctor": "Dr. Evelyn Reed", "specialty": "Cardiology", "date": "2026-06-18", "time": "10:30 AM", "status": "Confirmed", "symptoms": "Follow-up check" },
    { "id": "A102", "doctor": "Dr. Marcus Vance", "specialty": "Neurology", "date": "2026-06-22", "time": "02:15 PM", "status": "Pending", "symptoms": "Headache" }
]

medicines_db = [
    { "id": 1, "name": "Lisinopril", "dosage": "10mg", "time": "08:00 AM", "freq": "Once Daily", "status": "Taken" },
    { "id": 2, "name": "Metformin", "dosage": "500mg", "time": "13:00 PM", "freq": "Twice Daily", "status": "Pending" }
]

sms_db = [
    { "id": 1, "text": "MedAI Auth: Alex Mercer identity verified successfully at 2026-06-20 10:15 AM.", "timestamp": datetime.utcnow().isoformat(), "recipient": "+1 (555) 019-2834" },
    { "id": 2, "text": "MedAI Appointment Confirmed: Cardiology consultation with Dr. Evelyn Reed on 2026-06-22 at 10:30 AM.", "timestamp": datetime.utcnow().isoformat(), "recipient": "+1 (555) 019-2834" }
]

@app.post("/api/auth/register", response_model=schemas.User)
def register(request: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if name or email is already registered
    existing_by_name = crud.get_user_by_name(db, request.name)
    existing_by_email = crud.get_user_by_email(db, request.email)
    if existing_by_name or existing_by_email:
        raise HTTPException(
            status_code=400,
            detail="Username or email is already registered."
        )
    user = crud.create_user(db, request)
    return user

@app.post("/api/auth/login")
def login(request: schemas.UserLogin, db: Session = Depends(get_db)):
    import hashlib
    # Find user by name (username) first, then email
    db_user = crud.get_user_by_name(db, request.username)
    if not db_user:
        db_user = crud.get_user_by_email(db, request.username)
        
    if not db_user:
        # Username not registered - return 404
        raise HTTPException(
            status_code=404,
            detail="Username is not registered. Please sign up."
        )
    
    # Validate password
    pwd_hash = hashlib.sha256(request.password.encode('utf-8')).hexdigest()
    if db_user.password_hash != pwd_hash:
        raise HTTPException(
            status_code=401,
            detail="Incorrect password. Please try again."
        )
        
    return {
        "status": "success",
        "message": "Authorization validation passed. Initializing session...",
        "user": { "id": db_user.id, "name": db_user.name, "role": db_user.role, "email": db_user.email }
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
    
    # Send SMS notification
    sms_text = f"MedAI Booking Confirmed: Appointment with {doctor_name} ({specialty}) on {req.get('date')} at {req.get('time')}."
    sms_db.append({
        "id": len(sms_db) + 1,
        "text": sms_text,
        "timestamp": datetime.utcnow().isoformat(),
        "recipient": "+1 (555) 019-2834"
    })
    
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

@app.get("/api/sms")
def get_sms():
    return sms_db

@app.post("/api/sms")
def send_sms(req: dict):
    new_sms = {
        "id": len(sms_db) + 1,
        "text": req.get("text"),
        "timestamp": datetime.utcnow().isoformat(),
        "recipient": req.get("recipient", "+1 (555) 019-2834")
    }
    sms_db.append(new_sms)
    return new_sms

@app.post("/api/emergency/sos")
def trigger_sos():
    sms_text = "MedAI Emergency SOS: Vitals critical. Ambulance Unit #4B dispatched. ETA: 7 mins."
    sms_db.append({
        "id": len(sms_db) + 1,
        "text": sms_text,
        "timestamp": datetime.utcnow().isoformat(),
        "recipient": "+1 (555) 019-2834"
    })
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
                bot_name = data.get("bot_name", "NaturalSpeechAuth")
                simulate_db_timeout = data.get("simulate_db_timeout", False)
                consecutive_errors = data.get("consecutive_errors", 0)
                
                if not session_id or not user_text:
                    await websocket.send_json({"error": "Missing session_id or text payload."})
                    continue
                
                start_time = datetime.utcnow()
                
                # Check for Simulated Database Timeout (Bypass)
                if simulate_db_timeout:
                    ai_response = "I am currently experiencing an issue accessing our schedule database. Let me transfer you directly to our front desk clinic receptionist right away."
                    # Simulate high query latency (> 1.5s)
                    latency = 1650
                    sip_transfer = True
                    
                    # Log to DB
                    crud.create_transcript(db, schemas.TranscriptCreate(session_id=session_id, speaker="User", text="[DATABASE TIMEOUT SIMULATION]"))
                    crud.create_transcript(db, schemas.TranscriptCreate(session_id=session_id, speaker="AI", text=ai_response, latency_ms=latency))
                    
                    # Outbound transactional SMS log
                    sms_db.append({
                        "id": len(sms_db) + 1,
                        "text": "MedAI System Warning: Call transferred to receptionist due to scheduling database access timeout.",
                        "timestamp": datetime.utcnow().isoformat(),
                        "recipient": "+1 (555) 019-2834"
                    })
                    
                    await websocket.send_json({
                        "speaker": "AI",
                        "text": ai_response,
                        "audio_url": get_tts_audio_url(ai_response),
                        "latency_ms": latency,
                        "sip_transfer": True
                    })
                    continue
                
                # Check for Simulated Voice Error Handoff (Bypass)
                if consecutive_errors >= 2:
                    ai_response = "I am sorry, I am having trouble understanding your voice. Let me transfer you directly to a physical receptionist to assist you."
                    latency = 120
                    sip_transfer = True
                    
                    # Log to DB
                    crud.create_transcript(db, schemas.TranscriptCreate(session_id=session_id, speaker="User", text=user_text))
                    crud.create_transcript(db, schemas.TranscriptCreate(session_id=session_id, speaker="AI", text=ai_response, latency_ms=latency))
                    
                    # Outbound transactional SMS log
                    sms_db.append({
                        "id": len(sms_db) + 1,
                        "text": "MedAI Connection: Call warm-transferred to front desk following multiple speech recognition failures.",
                        "timestamp": datetime.utcnow().isoformat(),
                        "recipient": "+1 (555) 019-2834"
                    })
                    
                    await websocket.send_json({
                        "speaker": "AI",
                        "text": ai_response,
                        "audio_url": get_tts_audio_url(ai_response),
                        "latency_ms": latency,
                        "sip_transfer": True
                    })
                    continue
                
                # 1. Store User Statement in Database
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
                
                # 3. Store AI Response in Database
                crud.create_transcript(
                    db,
                    schemas.TranscriptCreate(
                        session_id=session_id,
                        speaker="AI",
                        text=ai_response,
                        latency_ms=latency
                    )
                )
                
                # 4. Parse specific outcomes to trigger SMS or system syncs
                sip_transfer = False
                emergency_routing = False
                telemedicine_bridge = False
                
                # Check for Emergency Severity Classification ESI triggers
                if "[EMERGENCY_ROUTING" in ai_response or "emergency floor" in ai_response.lower() or (bot_name == "EmergencySeverity" and "emergency" in user_text.lower()):
                    emergency_routing = True
                    sms_db.append({
                        "id": len(sms_db) + 1,
                        "text": "MedAI EMERGENCY SOS: Crisis classification triggered. Bypassing administrative lines. Ambulance Unit #4B dispatched. ETA: 7 mins.",
                        "timestamp": datetime.utcnow().isoformat(),
                        "recipient": "+1 (555) 019-2834"
                    })
                
                # Check for Telemedicine video bridge transition
                if "[TELEMEDICINE_BRIDGE" in ai_response or "webrtc telemedicine bridge" in ai_response.lower():
                    telemedicine_bridge = True
                    sms_db.append({
                        "id": len(sms_db) + 1,
                        "text": "MedAI Consultation Link: Secure video telehealth bridge ready. Connect now: https://medai.flow/telehealth-bridge/vc-3841",
                        "timestamp": datetime.utcnow().isoformat(),
                        "recipient": "+1 (555) 019-2834"
                    })
                
                # Handle Natural Speech Authentication Success
                if bot_name == "NaturalSpeechAuth" and "verified" in ai_response.lower():
                    sms_db.append({
                        "id": len(sms_db) + 1,
                        "text": "MedAI Security Alert: Identity verified successfully for patient Alex Mercer. EHR records unlocked.",
                        "timestamp": datetime.utcnow().isoformat(),
                        "recipient": "+1 (555) 019-2834"
                    })
                
                # Handle Scheduling outcome confirmation
                if bot_name == "ConversationalScheduling" and ("confirm" in ai_response.lower() or "schedule" in ai_response.lower() or "book" in ai_response.lower()):
                    # Add mock booked slot dynamically to EHR
                    new_appt_id = f"A{100 + len(appointments_db) + 1}"
                    appointments_db.append({
                        "id": new_appt_id,
                        "doctor": "Dr. Sarah Foster",
                        "specialty": "Pediatrics",
                        "date": datetime.utcnow().strftime("%Y-%m-%d"),
                        "time": "10:00 AM",
                        "status": "Confirmed",
                        "symptoms": user_text[:80]
                    })
                    sms_db.append({
                        "id": len(sms_db) + 1,
                        "text": f"MedAI Booking Confirmed: Pediatric appointment booked via Voice Bot. Date: Today, Time: 10:00 AM. ID: {new_appt_id}",
                        "timestamp": datetime.utcnow().isoformat(),
                        "recipient": "+1 (555) 019-2834"
                    })
                
                # Handle Post-Discharge Wellness scorecard completion
                if bot_name == "PostDischargeCheckIn" and ("recorded" in ai_response.lower() or "scorecard" in ai_response.lower() or "finished" in ai_response.lower()):
                    sms_db.append({
                        "id": len(sms_db) + 1,
                        "text": "MedAI Wellness Check-in: Recovery scorecard successfully uploaded to clinical dashboard. Recovery Index: Stable (5/5).",
                        "timestamp": datetime.utcnow().isoformat(),
                        "recipient": "+1 (555) 019-2834"
                    })
                
                # Handle Medication Adherence Yes/No affirmation
                if bot_name == "MedicationAdherence" and ("log" in ai_response.lower() or "taken" in ai_response.lower() or "adherence" in ai_response.lower()):
                    # Mark Metformin as taken
                    for med in medicines_db:
                        if med["name"] == "Metformin":
                            med["status"] = "Taken"
                    sms_db.append({
                        "id": len(sms_db) + 1,
                        "text": "MedAI Med Alert: Adherence confirmed for Lisinopril and Metformin. Compliance logs updated.",
                        "timestamp": datetime.utcnow().isoformat(),
                        "recipient": "+1 (555) 019-2834"
                    })
                
                # Handle Insurance policy intake estimate
                if bot_name == "InsurancePolicyIntake" and ("estimate" in ai_response.lower() or "out-of-pocket" in ai_response.lower()):
                    sms_db.append({
                        "id": len(sms_db) + 1,
                        "text": "MedAI Finance: BlueCross pre-auth approved. Est. out-of-pocket co-pay: $45.00. Statement sent.",
                        "timestamp": datetime.utcnow().isoformat(),
                        "recipient": "+1 (555) 019-2834"
                    })
                
                # 5. Build Google TTS audio URL
                audio_url = get_tts_audio_url(ai_response)
                
                # Send text and audio URL back to the client
                await websocket.send_json({
                    "speaker": "AI",
                    "text": ai_response,
                    "audio_url": audio_url,
                    "latency_ms": latency,
                    "sip_transfer": sip_transfer,
                    "emergency_routing": emergency_routing,
                    "telemedicine_bridge": telemedicine_bridge
                })
    except WebSocketDisconnect:
        print("WebSocket client disconnected.")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        db.close()

# Serving static frontend files (React built bundle first, fallback to source)
frontend_path = "../frontend/dist"
if not os.path.exists(frontend_path):
    frontend_path = "frontend/dist"
if not os.path.exists(frontend_path):
    frontend_path = "../frontend"
if not os.path.exists(frontend_path):
    frontend_path = "frontend"

if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")