import os
import random
from datetime import datetime
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="MedAI Flow API", version="1.0.0")

# Enable CORS for convenience
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory databases
appointments_db = [
    { "id": "A101", "doctor": "Dr. Evelyn Reed", "specialty": "Cardiology", "date": "2026-06-18", "time": "10:30 AM", "status": "Confirmed" },
    { "id": "A102", "doctor": "Dr. Marcus Vance", "specialty": "Neurology", "date": "2026-06-22", "time": "02:15 PM", "status": "Pending" }
]

medicines_db = [
    { "id": 1, "name": "Lisinopril", "dosage": "10mg", "time": "08:00 AM", "freq": "Once Daily", "status": "Taken" },
    { "id": 2, "name": "Metformin", "dosage": "500mg", "time": "13:00 PM", "freq": "Twice Daily", "status": "Pending" }
]

emergency_dispatches = []

# Schemas
class LoginRequest(BaseModel):
    email: str
    password: str

class AppointmentRequest(BaseModel):
    doctor: str
    date: str
    time: str
    symptoms: str = ""

class MedicineRequest(BaseModel):
    name: str
    dosage: str
    time: str

# API Routes

@app.post("/api/auth/login")
def login(request: LoginRequest):
    if len(request.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Security Exception: Password parameter requires at least 6 characters."
        )
    return {
        "status": "success",
        "message": "Authorization validation passed. Initializing session...",
        "user": { "name": "Alex Mercer", "role": "Patient" }
    }

@app.get("/api/telemetry")
def get_telemetry():
    # Return simulated biometric data
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
def add_appointment(req: AppointmentRequest):
    doctor_mapping = {
        "Dr. Reed": ("Dr. Evelyn Reed", "Cardiology"),
        "Dr. Vance": ("Dr. Marcus Vance", "Neurology"),
        "Dr. Foster": ("Dr. Sarah Foster", "Pediatrics")
    }
    doctor_name, specialty = doctor_mapping.get(req.doctor, (req.doctor, "General Practice"))
    
    new_id = f"A{100 + len(appointments_db) + 1}"
    new_appointment = {
        "id": new_id,
        "doctor": doctor_name,
        "specialty": specialty,
        "date": req.date,
        "time": req.time,
        "status": "Pending",
        "symptoms": req.symptoms
    }
    appointments_db.append(new_appointment)
    return new_appointment

@app.get("/api/medicines")
def get_medicines():
    return medicines_db

@app.post("/api/medicines")
def add_medicine(req: MedicineRequest):
    new_id = len(medicines_db) + 1
    new_med = {
        "id": new_id,
        "name": req.name,
        "dosage": req.dosage,
        "time": req.time,
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
    dispatch_info = {
        "status": "Dispatched",
        "unit": "Ambulance Unit #4B",
        "eta_minutes": 7,
        "timestamp": datetime.utcnow().isoformat()
    }
    emergency_dispatches.append(dispatch_info)
    return {
        "status": "success",
        "message": "CRITICAL SIGNAL BROADCASTING: GPS coordinates and real-time medical vectors routed to first response units.",
        "dispatch": dispatch_info
    }

# Serving the static frontend files
frontend_path = "../frontend"
if not os.path.exists(frontend_path):
    frontend_path = "frontend"

if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")