from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app import schemas, models, crud
from app.database import get_db
from app.dependencies import require_admin_role

router = APIRouter(prefix="/api/prompts", tags=["prompts"])

@router.get("", response_model=List[schemas.PromptTemplate], summary="List all bot prompt templates (Admin only)")
def get_all_prompts(db: Session = Depends(get_db), _: None = Depends(require_admin_role)):
    return db.query(models.PromptTemplate).all()

@router.post("", response_model=schemas.PromptTemplate, summary="Create or update a bot prompt template (Admin only)")
def create_or_update_prompt(prompt: schemas.PromptTemplateCreate, db: Session = Depends(get_db), _: None = Depends(require_admin_role)):
    return crud.create_or_update_prompt_template(db, prompt)
