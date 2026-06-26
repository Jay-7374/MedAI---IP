import os
import random
from datetime import datetime
from uuid import UUID
from fastapi import (
    FastAPI,
    HTTPException,
    status,
    Depends,
    Header,
    WebSocket,
    WebSocketDisconnect,
    Request,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List

from app.config import settings
from app.database import engine, SessionLocal, Base, get_db
from app import models, schemas, crud
from app.services.voice_bot import process_voice_turn, DEFAULT_PROMPTS
from app.services.tts import get_tts_audio_url
from app.services import twilio_service

app = FastAPI(title="Salus Fullstack GenAI Voice Bot API", version="1.0.0")

# CORS — restrict to known origins; use ALLOWED_ORIGIN env-var in production
_raw_origin = os.getenv("ALLOWED_ORIGIN", "")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origin.split(",") if o.strip()] or [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Startup Seeding and Table Initialization
@app.on_event("startup")
def startup_db_seeding():
    if engine is not None:
        try:
            Base.metadata.create_all(bind=engine)
            print("Database tables initialized.")

            # Seed default templates and roles
            db = SessionLocal()
            
            roles_to_seed = [
                {
                    "id": UUID("e15d9fb8-0eed-4972-a943-4027f35c4033"),
                    "role_name": "admin",
                    "description": "Administrator role",
                },
                {
                    "id": UUID("48b1cb7a-c2cd-498c-a85b-6e65fb76397a"),
                    "role_name": "staff",
                    "description": "Clinical staff role",
                },
                {
                    "id": UUID("97f70304-757b-4e45-ab65-d7d82367bba0"),
                    "role_name": "patient",
                    "description": "Patient role",
                },
                {
                    "id": UUID("c12d8ab3-e2cc-4911-a89c-48c0375fbda3"),
                    "role_name": "doctor",
                    "description": "Doctor / Clinician role",
                },
                {
                    "id": UUID("d34e9bc4-f3dd-4022-b9cd-59d1486fbdb4"),
                    "role_name": "receptionist",
                    "description": "Receptionist role",
                },
            ]
            for r in roles_to_seed:
                existing_role = (
                    db.query(models.Role)
                    .filter(models.Role.role_name == r["role_name"])
                    .first()
                )
                if existing_role:
                    existing_role.description = r["description"]
                else:
                    db.add(models.Role(**r))
            db.commit()

            # Clear old templates first
            db.query(models.PromptTemplate).delete()
            db.commit()

            for bot_name, system_prompt in DEFAULT_PROMPTS.items():
                crud.create_or_update_prompt_template(
                    db,
                    schemas.PromptTemplateCreate(
                        bot_name=bot_name, system_prompt=system_prompt
                    ),
                )

            # Seed default patient user with password credentials
            if not crud.get_user_by_email(db, "patient@medai.com"):
                crud.create_user(
                    db,
                    schemas.UserCreate(
                        name="Alex Mercer",
                        email="patient@medai.com",
                        password="123456",
                    ),
                )
            if not crud.get_user_by_email(db, "admin@medai.com"):
                crud.create_user(
                    db,
                    schemas.UserCreate(
                        name="Salus Admin",
                        email="admin@medai.com",
                        password="admin123",
                    ),
                    role_name="admin",
                )
            db.close()
            print(
                "Database seeded successfully with password authentication and templates."
            )
        except Exception as e:
            print(f"Error initializing/seeding database: {e}")


# ==================== LEGACY / FRONTEND PAGES COMPATIBILITY ====================
appointments_db = [
    {
        "id": "A101",
        "doctor": "Dr. Evelyn Reed",
        "specialty": "Cardiology",
        "date": "2026-06-18",
        "time": "10:30 AM",
        "status": "Confirmed",
        "symptoms": "Follow-up check",
    },
    {
        "id": "A102",
        "doctor": "Dr. Marcus Vance",
        "specialty": "Neurology",
        "date": "2026-06-22",
        "time": "02:15 PM",
        "status": "Pending",
        "symptoms": "Headache",
    },
]

medicines_db = [
    {
        "id": 1,
        "name": "Lisinopril",
        "dosage": "10mg",
        "time": "08:00 AM",
        "freq": "Once Daily",
        "status": "Taken",
    },
    {
        "id": 2,
        "name": "Metformin",
        "dosage": "500mg",
        "time": "13:00 PM",
        "freq": "Twice Daily",
        "status": "Pending",
    },
]

sms_db = [
    {
        "id": 1,
        "text": "Salus Auth: Alex Mercer identity verified successfully at 2026-06-20 10:15 AM.",
        "timestamp": datetime.utcnow().isoformat(),
        "recipient": "+1 (555) 019-2834",
    },
    {
        "id": 2,
        "text": "Salus Appointment Confirmed: Cardiology consultation with Dr. Evelyn Reed on 2026-06-22 at 10:30 AM.",
        "timestamp": datetime.utcnow().isoformat(),
        "recipient": "+1 (555) 019-2834",
    },
]


def dispatch_sms(text: str, recipient: str = None) -> dict:
    """
    Logs the message to the in-memory sms_db (so the dashboard UI keeps working
    exactly as before) AND, if Twilio is configured, actually sends it via
    Twilio SMS to `recipient` (or settings.DEFAULT_PATIENT_PHONE if not given).

    On a Twilio trial account, the recipient number must be a Verified Caller ID
    or the real send will fail (the dashboard log entry is still recorded either way).
    """
    to_number = (
        recipient or settings.DEFAULT_PATIENT_PHONE or "+1 (555) 019-2834"
    )
    entry = {
        "id": len(sms_db) + 1,
        "text": text,
        "timestamp": datetime.utcnow().isoformat(),
        "recipient": to_number,
    }
    sms_db.append(entry)

    if twilio_service.is_configured():
        result = twilio_service.send_sms(to_number, text)
        entry["twilio_status"] = "sent" if result.get("sent") else "failed"
        entry["twilio_detail"] = (
            result.get("sid") if result.get("sent") else result.get("reason")
        )
    else:
        entry["twilio_status"] = "not_configured"

    return entry


@app.post("/api/auth/register", response_model=schemas.User)
def register(request: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if name or email is already registered
    existing_by_name = crud.get_user_by_name(db, request.name)
    existing_by_email = crud.get_user_by_email(db, request.email)
    if existing_by_name or existing_by_email:
        raise HTTPException(
            status_code=400, detail="Username or email is already registered."
        )
    user = crud.create_user(db, request, role_name=(request.role.lower() if request.role else "patient"))
    return user


@app.post("/api/auth/login")
def login(request: schemas.UserLogin, db: Session = Depends(get_db)):
    # Find user by name (username) first, then email
    db_user = crud.get_user_by_name(db, request.username)
    if not db_user:
        db_user = crud.get_user_by_email(db, request.username)

    if not db_user:
        # Username not registered - return 404
        raise HTTPException(
            status_code=404,
            detail="Username is not registered. Please sign up.",
        )

    # Validate password
    if db_user.password != request.password:
        raise HTTPException(
            status_code=401, detail="Incorrect password. Please try again."
        )

    role_name = db_user.role.role_name if db_user.role else "patient"

    return {
        "id": db_user.id,
        "name": db_user.name,
        "email": db_user.email,
        "role": role_name,
    }


@app.get("/api/telemetry")
def get_telemetry():
    heartrate = random.randint(70, 78)
    spo2 = random.randint(97, 99)
    return {
        "heartrate": heartrate,
        "spo2": spo2,
        "blood_pressure": "120/80",
        "temperature": "36.7",
    }


@app.get("/api/appointments")
def get_appointments():
    return appointments_db


@app.post("/api/appointments")
def add_appointment(req: dict):
    doctor_mapping = {
        "Dr. Reed": ("Dr. Evelyn Reed", "Cardiology"),
        "Dr. Vance": ("Dr. Marcus Vance", "Neurology"),
        "Dr. Foster": ("Dr. Sarah Foster", "Pediatrics"),
    }
    doctor_name, specialty = doctor_mapping.get(
        req.get("doctor"), (req.get("doctor"), "General Practice")
    )
    new_id = f"A{100 + len(appointments_db) + 1}"
    new_appointment = {
        "id": new_id,
        "doctor": doctor_name,
        "specialty": specialty,
        "date": req.get("date"),
        "time": req.get("time"),
        "status": "Pending",
        "symptoms": req.get("symptoms", ""),
    }
    appointments_db.append(new_appointment)

    # Send SMS notification
    sms_text = f"MedAI Booking Confirmed: Appointment with {doctor_name} ({specialty}) on {req.get('date')} at {req.get('time')}."
    dispatch_sms(sms_text)

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
        "status": "Pending",
    }
    medicines_db.append(new_med)
    return new_med


@app.delete("/api/medicines/{name}")
def delete_medicine(name: str):
    global medicines_db
    initial_len = len(medicines_db)
    medicines_db = [
        m for m in medicines_db if m["name"].lower() != name.lower()
    ]
    if len(medicines_db) == initial_len:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return {"status": "success", "message": f"Medicine {name} removed."}


@app.get("/api/sms")
def get_sms():
    return sms_db


@app.post("/api/sms")
def send_sms(req: dict):
    recipient = (
        req.get("recipient")
        or settings.DEFAULT_PATIENT_PHONE
        or "+1 (555) 019-2834"
    )
    return dispatch_sms(req.get("text"), recipient=recipient)


@app.post("/api/emergency/sos")
def trigger_sos():
    sms_text = "MedAI Emergency SOS: Vitals critical. Ambulance Unit #4B dispatched. ETA: 7 mins."
    dispatch_sms(sms_text)
    return {
        "status": "success",
        "message": "CRITICAL SIGNAL BROADCASTING: GPS coordinates and real-time medical vectors routed to first response units.",
        "dispatch": {
            "status": "Dispatched",
            "unit": "Ambulance Unit #4B",
            "eta_minutes": 7,
            "timestamp": datetime.utcnow().isoformat(),
        },
    }


# ==================== OUTBOUND VOICE CALLS (real Twilio) ====================
# This is what makes "Patient follow-up calls", "Medicine reminder assistant",
# and "Elder care monitoring" actually call the patient, instead of only
# working when the patient opens the browser dashboard.
#
# Flow:
#   1. POST /api/calls/outbound -> Twilio dials the patient's phone
#   2. Twilio fetches GET/POST /twiml/voice-start -> bot speaks its opening line,
#      then <Gather>'s the patient's spoken reply
#   3. Twilio POSTs the transcribed speech to /twiml/voice-gather -> we run it
#      through the same LLM persona used in the browser bot (process_voice_turn),
#      speak the reply, and <Gather> again (loop) until the patient hangs up.
#
# REQUIRES: settings.PUBLIC_BASE_URL must be a public HTTPS URL Twilio can reach
# (e.g. an ngrok tunnel in dev, your real domain in production).


@app.post("/api/calls/outbound")
def start_outbound_call(req: dict, db: Session = Depends(get_db)):
    """
    Trigger a real outbound call to a patient.
    Body: { "bot_name": "PostDischargeCheckIn", "to": "+91..." (optional, defaults to DEFAULT_PATIENT_PHONE) }
    """
    bot_name = req.get("bot_name", "PostDischargeCheckIn")
    to_number = req.get("to") or settings.DEFAULT_PATIENT_PHONE
    if not to_number:
        raise HTTPException(
            status_code=400,
            detail="No 'to' number given and DEFAULT_PATIENT_PHONE is not set in .env",
        )

    if not settings.PUBLIC_BASE_URL:
        raise HTTPException(
            status_code=400,
            detail="PUBLIC_BASE_URL is not set in .env. Twilio needs a public HTTPS URL to fetch call instructions "
            "(run `ngrok http 8000` and put the https URL it gives you into PUBLIC_BASE_URL).",
        )

    if not twilio_service.is_configured():
        raise HTTPException(
            status_code=400,
            detail="Twilio is not configured (missing SID/Auth Token/Phone Number in .env)",
        )

    twiml_url = f"{settings.PUBLIC_BASE_URL.rstrip('/')}/twiml/voice-start?bot_name={bot_name}"
    result = twilio_service.make_outbound_call(to_number, twiml_url)
    if not result.get("called"):
        raise HTTPException(
            status_code=502,
            detail=f"Twilio call failed: {result.get('reason')}",
        )
    return result


def _xml_response(twiml: str) -> Response:
    return Response(content=twiml, media_type="application/xml")


@app.api_route("/twiml/voice-start", methods=["GET", "POST"])
def twiml_voice_start(bot_name: str = "PostDischargeCheckIn"):
    """First thing Twilio fetches when the call connects: bot speaks, then listens."""
    opening_lines = {
        "NaturalSpeechAuth": "Hello, this is ARIA from Salus. I need to verify your identity before we proceed. Could you please tell me your full name?",
        "ConversationalScheduling": "Hello, this is NOVA from Salus Scheduling. I can help you book, reschedule, or enquire about appointments and diagnostic tests. What can I help you with today?",
        "PostDischargeCheckIn": "Hello, this is CARE from Salus. I'm calling for your post-discharge recovery check-in. I have five quick questions about how you've been feeling since leaving the hospital. Is now a good time?",
        "MedicationAdherence": "Hello, this is MEDI from Salus. I'm calling with your daily medication reminder. I'll go through each of your prescribed medications one by one. Are you ready?",
        "InsurancePolicyIntake": "Hello, this is FELIX from Salus's billing team. I'm calling to help you understand your insurance coverage and estimated costs. Could you tell me the name of your insurance provider?",
        "EmergencySeverity": "Hello, this is RAPID from Salus Emergency Triage. I'm here to assess your situation and get you the right level of care. Please describe your symptoms and how long you've been experiencing them.",
        "AiNurseAdvice": "Hello, this is NORA, your Salus nurse assistant. I'm here to answer any questions about your recovery, medications, diet, or wound care. What would you like to know?",
        "ElderCareTerminal": "Hello! This is GRACE from Salus. I'm just calling to check in and have a little chat. How are you feeling today?",
        "TelemedicineBridge": "Hello, this is CONNECT from Salus. I'm calling to prepare you for your upcoming virtual doctor consultation. I'll just run through a quick checklist to make sure everything is ready. Does that sound okay?",
    }
    opening = opening_lines.get(
        bot_name,
        "Hello, this is Salus calling to check in with you. How are you doing today?",
    )
    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="/twiml/voice-gather?bot_name={bot_name}" method="POST" speechTimeout="auto">
        <Say voice="Polly.Joanna">{opening}</Say>
    </Gather>
    <Say voice="Polly.Joanna">We didn't hear a response. Goodbye for now.</Say>
</Response>"""
    return _xml_response(twiml)


@app.post("/twiml/voice-gather")
async def twiml_voice_gather(
    request: Request,
    bot_name: str = "PostDischargeCheckIn",
    db: Session = Depends(get_db),
):
    """Twilio posts the patient's transcribed speech here on every turn of the call."""
    form = await request.form()
    speech_result = form.get("SpeechResult", "")
    call_sid = form.get("CallSid", "unknown-call")

    if not speech_result:
        twiml = (
            """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Sorry, I didn't catch that. Could you say that again?</Say>
    <Redirect method="GET">/twiml/voice-start?bot_name="""
            + bot_name
            + """</Redirect>
</Response>"""
        )
        return _xml_response(twiml)

    # Reuse the exact same LLM persona logic as the browser-based voice bot,
    # using the Twilio CallSid as the session id so each call has its own transcript.
    ai_response = process_voice_turn(db, call_sid, speech_result, bot_name)

    crud.create_transcript(
        db,
        schemas.TranscriptCreate(
            session_id=call_sid, speaker="User", text=speech_result
        ),
    )
    crud.create_transcript(
        db,
        schemas.TranscriptCreate(
            session_id=call_sid, speaker="AI", text=ai_response
        ),
    )

    hangup_words = [
        "goodbye",
        "bye",
        "thank you, that's all",
        "that's all for now",
    ]
    should_hangup = any(w in speech_result.lower() for w in hangup_words)

    if should_hangup:
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">{ai_response}</Say>
    <Say voice="Polly.Joanna">Thank you, take care. Goodbye.</Say>
    <Hangup/>
</Response>"""
    else:
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="/twiml/voice-gather?bot_name={bot_name}" method="POST" speechTimeout="auto">
        <Say voice="Polly.Joanna">{ai_response}</Say>
    </Gather>
    <Say voice="Polly.Joanna">We didn't hear anything else. Goodbye.</Say>
</Response>"""
    return _xml_response(twiml)


# ==================== VOICE BOT CORE APIs ====================


@app.post("/api/users", response_model=schemas.User)
def create_or_get_user(
    user: schemas.UserCreate, db: Session = Depends(get_db)
):
    db_user = crud.get_user_by_email(db, user.email)
    if not db_user:
        db_user = crud.create_user(db, user)
    return db_user


@app.post("/api/sessions", response_model=schemas.CallSession)
def create_session(
    session: schemas.CallSessionCreate, db: Session = Depends(get_db)
):
    db_session = crud.get_session(db, session.id)
    if not db_session:
        db_session = crud.create_session(db, session)
    return db_session


@app.get(
    "/api/sessions/{session_id}/transcripts",
    response_model=List[schemas.Transcript],
)
def get_session_transcripts(session_id: str, db: Session = Depends(get_db)):
    return crud.get_transcripts_by_session(db, session_id)


# ---------- Role guard helper ----------
ADMIN_ROLES = {"admin", "staff", "doctor", "receptionist"}


def require_admin_role(x_user_role: str = Header("patient", alias="X-User-Role")):
    """
    Reads X-User-Role header sent by the frontend on every request.
    Raises 403 if the caller is not an admin.
    """
    if x_user_role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrator privileges required.",
        )


@app.get("/api/prompts", response_model=List[schemas.PromptTemplate])
def get_all_prompts(
    db: Session = Depends(get_db),
    _: None = Depends(require_admin_role),
):
    return db.query(models.PromptTemplate).all()


@app.post("/api/prompts", response_model=schemas.PromptTemplate)
def create_or_update_prompt(
    prompt: schemas.PromptTemplateCreate,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin_role),
):
    return crud.create_or_update_prompt_template(db, prompt)


@app.post("/api/voice/turn")
def voice_turn(
    session_id: str,
    user_text: str,
    bot_name: str = "General",
    db: Session = Depends(get_db),
):
    """
    HTTP route for processing a single user voice turn.
    Saves input/output in database, and returns TTS audio link.
    """
    start_time = datetime.utcnow()

    # 1. Save User Statement
    crud.create_transcript(
        db,
        schemas.TranscriptCreate(
            session_id=session_id, speaker="User", text=user_text
        ),
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
            latency_ms=latency,
        ),
    )

    # 4. Generate direct TTS audio URL
    audio_url = get_tts_audio_url(ai_response)

    return {
        "user_text": user_text,
        "ai_response": ai_response,
        "audio_url": audio_url,
        "latency_ms": latency,
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

                # --- Input validation ---
                if (
                    not session_id
                    or not isinstance(session_id, str)
                    or len(session_id) > 128
                ):
                    await websocket.send_json(
                        {"error": "Invalid or missing session_id."}
                    )
                    continue
                if not user_text or not isinstance(user_text, str):
                    await websocket.send_json(
                        {"error": "Missing text payload."}
                    )
                    continue
                # Sanitize: strip excessively long inputs
                user_text = user_text.strip()[:1000]
                if not user_text:
                    await websocket.send_json({"error": "Empty text payload."})
                    continue

                start_time = datetime.utcnow()

                # Check for Simulated Database Timeout (Bypass)
                if simulate_db_timeout:
                    ai_response = "I am currently experiencing an issue accessing our schedule database. Let me transfer you directly to our front desk clinic receptionist right away."
                    # Simulate high query latency (> 1.5s)
                    latency = 1650
                    sip_transfer = True

                    # Log to DB
                    crud.create_transcript(
                        db,
                        schemas.TranscriptCreate(
                            session_id=session_id,
                            speaker="User",
                            text="[DATABASE TIMEOUT SIMULATION]",
                        ),
                    )
                    crud.create_transcript(
                        db,
                        schemas.TranscriptCreate(
                            session_id=session_id,
                            speaker="AI",
                            text=ai_response,
                            latency_ms=latency,
                        ),
                    )

                    # Outbound transactional SMS log
                    dispatch_sms(
                        "Salus System Warning: Call transferred to receptionist due to scheduling database access timeout."
                    )

                    await websocket.send_json(
                        {
                            "speaker": "AI",
                            "text": ai_response,
                            "audio_url": get_tts_audio_url(ai_response),
                            "latency_ms": latency,
                            "sip_transfer": True,
                        }
                    )
                    continue

                # Check for Simulated Voice Error Handoff (Bypass)
                if consecutive_errors >= 2:
                    ai_response = "I am sorry, I am having trouble understanding your voice. Let me transfer you directly to a physical receptionist to assist you."
                    latency = 120
                    sip_transfer = True

                    # Log to DB
                    crud.create_transcript(
                        db,
                        schemas.TranscriptCreate(
                            session_id=session_id,
                            speaker="User",
                            text=user_text,
                        ),
                    )
                    crud.create_transcript(
                        db,
                        schemas.TranscriptCreate(
                            session_id=session_id,
                            speaker="AI",
                            text=ai_response,
                            latency_ms=latency,
                        ),
                    )

                    # Outbound transactional SMS log
                    dispatch_sms(
                        "Salus Connection: Call warm-transferred to front desk following multiple speech recognition failures."
                    )

                    await websocket.send_json(
                        {
                            "speaker": "AI",
                            "text": ai_response,
                            "audio_url": get_tts_audio_url(ai_response),
                            "latency_ms": latency,
                            "sip_transfer": True,
                        }
                    )
                    continue

                # 1. Store User Statement in Database
                crud.create_transcript(
                    db,
                    schemas.TranscriptCreate(
                        session_id=session_id, speaker="User", text=user_text
                    ),
                )

                # 2. Get LLM response
                ai_response = process_voice_turn(
                    db, session_id, user_text, bot_name
                )

                latency = int(
                    (datetime.utcnow() - start_time).total_seconds() * 1000
                )

                # 3. Store AI Response in Database
                crud.create_transcript(
                    db,
                    schemas.TranscriptCreate(
                        session_id=session_id,
                        speaker="AI",
                        text=ai_response,
                        latency_ms=latency,
                    ),
                )

                # 4. Parse specific outcomes to trigger SMS or system syncs
                sip_transfer = False
                emergency_routing = False
                telemedicine_bridge = False

                # Check for Emergency Severity Classification ESI triggers
                if (
                    "[EMERGENCY_ROUTING" in ai_response
                    or "emergency floor" in ai_response.lower()
                    or (
                        bot_name == "EmergencySeverity"
                        and "emergency" in user_text.lower()
                    )
                ):
                    emergency_routing = True
                    dispatch_sms(
                        "Salus EMERGENCY SOS: Crisis classification triggered. Bypassing administrative lines. Ambulance Unit #4B dispatched. ETA: 7 mins."
                    )

                # Check for Telemedicine video bridge transition
                if (
                    "[TELEMEDICINE_BRIDGE" in ai_response
                    or "webrtc telemedicine bridge" in ai_response.lower()
                ):
                    telemedicine_bridge = True
                    dispatch_sms(
                        "Salus Consultation Link: Secure video telehealth bridge ready. Connect now: https://salus.flow/telehealth-bridge/vc-3841"
                    )

                # Handle Natural Speech Authentication Success
                if (
                    bot_name == "NaturalSpeechAuth"
                    and "verified" in ai_response.lower()
                ):
                    dispatch_sms(
                        "Salus Security Alert: Identity verified successfully for patient Alex Mercer. EHR records unlocked."
                    )

                # Handle Scheduling outcome confirmation
                if bot_name == "ConversationalScheduling" and (
                    "confirm" in ai_response.lower()
                    or "schedule" in ai_response.lower()
                    or "book" in ai_response.lower()
                ):
                    # Add mock booked slot dynamically to EHR
                    new_appt_id = f"A{100 + len(appointments_db) + 1}"
                    appointments_db.append(
                        {
                            "id": new_appt_id,
                            "doctor": "Dr. Sarah Foster",
                            "specialty": "Pediatrics",
                            "date": datetime.utcnow().strftime("%Y-%m-%d"),
                            "time": "10:00 AM",
                            "status": "Confirmed",
                            "symptoms": user_text[:80],
                        }
                    )
                    dispatch_sms(
                        f"Salus Booking Confirmed: Pediatric appointment booked via Voice Bot. Date: Today, Time: 10:00 AM. ID: {new_appt_id}"
                    )

                # Handle Post-Discharge Wellness scorecard completion
                if bot_name == "PostDischargeCheckIn" and (
                    "recorded" in ai_response.lower()
                    or "scorecard" in ai_response.lower()
                    or "finished" in ai_response.lower()
                ):
                    dispatch_sms(
                        "Salus Wellness Check-in: Recovery scorecard successfully uploaded to clinical dashboard. Recovery Index: Stable (5/5)."
                    )

                # Handle Medication Adherence Yes/No affirmation
                if bot_name == "MedicationAdherence" and (
                    "log" in ai_response.lower()
                    or "taken" in ai_response.lower()
                    or "adherence" in ai_response.lower()
                ):
                    # Mark Metformin as taken
                    for med in medicines_db:
                        if med["name"] == "Metformin":
                            med["status"] = "Taken"
                    dispatch_sms(
                        "Salus Med Alert: Adherence confirmed for Lisinopril and Metformin. Compliance logs updated."
                    )

                # Handle Insurance policy intake estimate
                if bot_name == "InsurancePolicyIntake" and (
                    "estimate" in ai_response.lower()
                    or "out-of-pocket" in ai_response.lower()
                ):
                    dispatch_sms(
                        "Salus Finance: BlueCross pre-auth approved. Est. out-of-pocket co-pay: $45.00. Statement sent."
                    )

                # 5. Build Google TTS audio URL
                audio_url = get_tts_audio_url(ai_response)

                # Send text and audio URL back to the client
                await websocket.send_json(
                    {
                        "speaker": "AI",
                        "text": ai_response,
                        "audio_url": audio_url,
                        "latency_ms": latency,
                        "sip_transfer": sip_transfer,
                        "emergency_routing": emergency_routing,
                        "telemedicine_bridge": telemedicine_bridge,
                    }
                )
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
    app.mount(
        "/", StaticFiles(directory=frontend_path, html=True), name="static"
    )
