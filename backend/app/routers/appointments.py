from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from datetime import date, datetime

router = APIRouter(prefix="/api/appointments", tags=["appointments"])

@router.get("", summary="List all patient appointments")
def get_appointments(db: Session = Depends(get_db)):
    appointments = db.query(models.Appointment).all()
    # Format to match frontend expectations or update frontend to use new format
    res = []
    for a in appointments:
        res.append({
            "id": f"A{a.id}",
            "doctor": a.doctor.user.name if a.doctor and a.doctor.user else "Unknown Doctor",
            "specialty": a.doctor.specialty if a.doctor else "General",
            "date": a.date.isoformat() if a.date else "",
            "time": a.time.strftime("%I:%M %p") if a.time else "",
            "status": a.status,
            "symptoms": a.symptoms
        })
    return res

@router.post("", summary="Book a new appointment")
def add_appointment(req: dict, db: Session = Depends(get_db)):
    from app.routers.telephony import dispatch_sms
    
    # Try to find doctor
    doc_name = req.get("doctor")
    doctor = db.query(models.Doctor).join(models.User).filter(models.User.name.ilike(f"%{doc_name}%")).first()
    
    if not doctor:
        doctor = db.query(models.Doctor).first()
        
    patient = db.query(models.Patient).first()
    
    if doctor and patient:
        new_apt = models.Appointment(
            patient_id=patient.id,
            doctor_id=doctor.id,
            date=date.fromisoformat(req.get("date")) if req.get("date") else date.today(),
            time=datetime.strptime(req.get("time"), "%H:%M").time() if req.get("time") and ":" in req.get("time") else datetime.now().time(),
            status="Scheduled",
            symptoms=req.get("symptoms", "")
        )
        db.add(new_apt)
        db.commit()
        db.refresh(new_apt)
    
    doc_display = doctor.user.name if doctor else req.get("doctor")
    spec_display = doctor.specialty if doctor else "General Practice"
    
    sms_text = f"MedAI Booking Confirmed: Appointment with {doc_display} ({spec_display}) on {req.get('date')} at {req.get('time')}."
    dispatch_sms(sms_text)

    return {
        "id": "A100",
        "doctor": doc_display,
        "specialty": spec_display,
        "date": req.get("date"),
        "time": req.get("time"),
        "status": "Scheduled",
        "symptoms": req.get("symptoms", "")
    }
