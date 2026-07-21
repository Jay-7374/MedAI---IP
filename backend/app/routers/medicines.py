from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models

router = APIRouter(prefix="/api/medicines", tags=["medicines"])

@router.get("", summary="List all prescribed medicines")
def get_medicines(db: Session = Depends(get_db)):
    prescriptions = db.query(models.Prescription).all()
    res = []
    for p in prescriptions:
        res.append({
            "id": p.id,
            "name": p.medication_name,
            "dosage": p.dosage,
            "time": "08:00 AM", # default placeholder as time isn't in prescription
            "freq": p.frequency,
            "status": "Pending",
        })
    return res

@router.post("", summary="Add a medicine to the patient's schedule")
def add_medicine(req: dict, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).first()
    if patient:
        new_med = models.Prescription(
            patient_id=patient.id,
            medication_name=req.get("name"),
            dosage=req.get("dosage"),
            frequency="Once Daily",
            purpose="Generated",
            status="Active"
        )
        db.add(new_med)
        db.commit()
        db.refresh(new_med)
        return {
            "id": new_med.id,
            "name": new_med.medication_name,
            "dosage": new_med.dosage,
            "time": req.get("time"),
            "freq": new_med.frequency,
            "status": "Pending",
        }
    return req

@router.delete("/{name}", summary="Remove a medicine by name")
def delete_medicine(name: str, db: Session = Depends(get_db)):
    med = db.query(models.Prescription).filter(models.Prescription.medication_name.ilike(name)).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    db.delete(med)
    db.commit()
    return {"status": "success", "message": f"Medicine {name} removed."}
