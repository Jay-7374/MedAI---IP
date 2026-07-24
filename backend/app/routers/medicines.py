from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.dependencies import get_current_user
from typing import List

router = APIRouter(prefix="/api/medicines", tags=["medicines"])

@router.get("", response_model=List[schemas.Medicine], summary="List all prescribed medicines")
def get_medicines(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    medicines = db.query(models.Medicine).filter(models.Medicine.user_id == current_user.id).all()
    return medicines

@router.post("", response_model=schemas.Medicine, summary="Add a medicine to the patient's schedule")
def add_medicine(req: schemas.MedicineCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    patient = db.query(models.Patient).filter(models.Patient.user_id == current_user.id).first()
    new_med = models.Medicine(
        user_id=current_user.id,
        patient_id=patient.id if patient else None,
        **req.model_dump(exclude_unset=True)
    )
    db.add(new_med)
    db.commit()
    db.refresh(new_med)
    return new_med

@router.put("/{id}", response_model=schemas.Medicine, summary="Update a medicine")
def update_medicine(id: int, req: schemas.MedicineCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    med = db.query(models.Medicine).filter(models.Medicine.id == id, models.Medicine.user_id == current_user.id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    
    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(med, key, value)
    
    db.commit()
    db.refresh(med)
    return med

@router.delete("/{id}", summary="Remove a medicine by id")
def delete_medicine(id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    med = db.query(models.Medicine).filter(models.Medicine.id == id, models.Medicine.user_id == current_user.id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    db.delete(med)
    db.commit()
    return {"status": "success", "message": f"Medicine {id} removed."}
