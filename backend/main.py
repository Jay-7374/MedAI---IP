import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date
from contextlib import asynccontextmanager
from fastapi.responses import PlainTextResponse
from starlette.requests import Request
import traceback

from app.config import settings
from app.database import engine, SessionLocal, Base
from app import models, schemas, crud
from app.services.voice_bot import DEFAULT_PROMPTS

from app.routers import (
    auth,
    appointments,
    medicines,
    telemetry,
    sos,
    prompts,
    voice,
    telephony,
    chatbot
)

TAGS_METADATA = [
    {"name": "authentication", "description": "🔐 **User registration and login.**"},
    {"name": "appointments", "description": "📅 **Patient appointment management.**"},
    {"name": "medicines", "description": "💊 **Medication schedule management.**"},
    {"name": "auth", "description": "🔐 **Authentication and user management.**"},
    {"name": "voice", "description": "🎙️ **Voice bots and TTS processing.**"},
    {"name": "patients", "description": "🏥 **EHR data (appointments, meds).**"},
    {"name": "calls", "description": "📞 **Outbound voice calls via Twilio.**"},
    {"name": "telemetry", "description": "📊 **Real-time dashboard metrics.**"},
    {"name": "prompts", "description": "📝 **LLM persona and prompt management.**"},
    {"name": "telephony", "description": "🔁 **Telephony webhooks (Twilio).**"},
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    startup_db_seeding()
    yield

app = FastAPI(
    title="MedAI API",
    version="1.0.0",
    description="Production-grade clinical AI platform powering voice bots via ElevenLabs & Twilio.",
    openapi_tags=TAGS_METADATA,
    lifespan=lifespan,
)

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

from fastapi.responses import PlainTextResponse
from starlette.requests import Request
import traceback

@app.exception_handler(Exception)
async def dump_exception_handler(request: Request, exc: Exception):
    with open("f:\\MedAI - IP\\backend\\500_error.txt", "w") as f:
        f.write(f"{type(exc).__name__}: {str(exc)}\n")
        f.write(traceback.format_exc())
    return PlainTextResponse("Internal Server Error", status_code=500)

app.include_router(auth.router)
app.include_router(appointments.router)
app.include_router(medicines.router)
app.include_router(telemetry.router)
app.include_router(sos.router)
app.include_router(prompts.router)
app.include_router(voice.router)
app.include_router(telephony.router)
app.include_router(chatbot.router)

def startup_db_seeding():
    if engine is not None:
        try:
            Base.metadata.create_all(bind=engine)
            print("Database tables initialized.")

            db = SessionLocal()
            
            roles_to_seed = [
                {"id": UUID("e15d9fb8-0eed-4972-a943-4027f35c4033"), "role_name": "admin", "description": "Administrator role"},
                {"id": UUID("48b1cb7a-c2cd-498c-a85b-6e65fb76397a"), "role_name": "staff", "description": "Clinical staff role"},
                {"id": UUID("97f70304-757b-4e45-ab65-d7d82367bba0"), "role_name": "patient", "description": "Patient role"},
                {"id": UUID("c12d8ab3-e2cc-4911-a89c-48c0375fbda3"), "role_name": "doctor", "description": "Doctor / Clinician role"},
                {"id": UUID("d34e9bc4-f3dd-4022-b9cd-59d1486fbdb4"), "role_name": "receptionist", "description": "Receptionist role"},
            ]
            for r in roles_to_seed:
                existing_role = db.query(models.Role).filter(models.Role.role_name == r["role_name"]).first()
                if not existing_role:
                    db.add(models.Role(**r))
            db.commit()

            # Seed Prompts
            db.query(models.PromptTemplate).delete()
            db.commit()
            for bot_name, system_prompt in DEFAULT_PROMPTS.items():
                crud.create_or_update_prompt_template(
                    db,
                    schemas.PromptTemplateCreate(
                        bot_name=bot_name, system_prompt=system_prompt
                    ),
                )

            # Seed Users
            patient_user = crud.get_user_by_email(db, "patient@medai.com")
            if not patient_user:
                patient_user = crud.create_user(
                    db,
                    schemas.UserCreate(name="Alex Mercer", email="patient@medai.com", password="123456"),
                )
            
            if not crud.get_user_by_email(db, "admin@medai.com"):
                crud.create_user(
                    db,
                    schemas.UserCreate(name="Salus Admin", email="admin@medai.com", password="admin123"),
                    role_name="admin",
                )
                
            # Seed Doctor dummy data
            doc_user = crud.get_user_by_email(db, "doctor@medai.com")
            if not doc_user:
                doc_user = crud.create_user(
                    db,
                    schemas.UserCreate(name="Dr. Evelyn Reed", email="doctor@medai.com", password="password"),
                    role_name="doctor",
                )
                
            dep = db.query(models.Department).filter(models.Department.name == "Cardiology").first()
            if not dep:
                dep = models.Department(name="Cardiology", description="Heart health")
                db.add(dep)
                db.commit()
                db.refresh(dep)
                
            doc = db.query(models.Doctor).filter(models.Doctor.user_id == doc_user.id).first()
            if not doc:
                doc = models.Doctor(user_id=doc_user.id, department_id=dep.id, specialty="Cardiology")
                db.add(doc)
                db.commit()

            # Seed Patient dummy data
            pat = db.query(models.Patient).filter(models.Patient.user_id == patient_user.id).first()
            if not pat:
                pat = models.Patient(
                    user_id=patient_user.id,
                    dob=date(1995, 7, 24),
                    phone_number="+15550192834",
                    ssn_last_4="7842",
                    insurance_provider="BlueCross BlueShield",
                    policy_number="98124"
                )
                db.add(pat)
                db.commit()
                db.refresh(pat)
                
                # Seed Prescriptions
                db.add(models.Prescription(patient_id=pat.id, medication_name="Lisinopril", dosage="10mg", frequency="Once Daily", purpose="Blood pressure"))
                db.add(models.Prescription(patient_id=pat.id, medication_name="Metformin", dosage="500mg", frequency="Twice Daily", purpose="Diabetes"))
                db.commit()

            db.close()
            print("Database seeded successfully with dummy data.")
        except Exception as e:
            print(f"Error initializing/seeding database: {e}")
