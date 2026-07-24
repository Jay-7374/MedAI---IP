from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.dependencies import get_current_user
from typing import List

router = APIRouter(prefix="/api/patients", tags=["patients"])

@router.get("/me", response_model=schemas.Patient)
def get_my_profile(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    patient = db.query(models.Patient).filter(models.Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return patient

@router.get("/all", response_model=List[schemas.Patient])
def get_all_patients(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Restrict to staff/admin if needed. For now, we will return all patients.
    if current_user.role and current_user.role.role_name in ['admin', 'staff', 'doctor', 'receptionist']:
        patients = db.query(models.Patient).all()
        return patients
    raise HTTPException(status_code=403, detail="Not authorized to view all patients")

@router.post("/me", response_model=schemas.Patient)
def create_my_profile(patient_in: schemas.PatientCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    existing_patient = db.query(models.Patient).filter(models.Patient.user_id == current_user.id).first()
    if existing_patient:
        raise HTTPException(status_code=400, detail="Profile already exists")
        
    new_patient = models.Patient(
        user_id=current_user.id,
        **patient_in.model_dump(exclude_unset=True)
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient

@router.put("/me", response_model=schemas.Patient)
def update_my_profile(patient_in: schemas.PatientCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    patient = db.query(models.Patient).filter(models.Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
        
    update_data = patient_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(patient, key, value)
        
    db.commit()
    db.refresh(patient)
    return patient
