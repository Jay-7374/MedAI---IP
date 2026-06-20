from sqlalchemy.orm import Session
from datetime import datetime
from . import models, schemas

import hashlib

# User operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_name(db: Session, name: str):
    return db.query(models.User).filter(models.User.name == name).first()

def create_user(db: Session, user: schemas.UserCreate):
    pwd_hash = hashlib.sha256(user.password.encode('utf-8')).hexdigest()
    db_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=pwd_hash,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Session operations
def create_session(db: Session, session: schemas.CallSessionCreate):
    db_session = models.CallSession(
        id=session.id,
        user_id=session.user_id,
        channel=session.channel,
        status=session.status
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def get_session(db: Session, session_id: str):
    return db.query(models.CallSession).filter(models.CallSession.id == session_id).first()

def update_session_status(db: Session, session_id: str, status: str):
    db_session = get_session(db, session_id)
    if db_session:
        db_session.status = status
        if status in ["Completed", "Ended"]:
            db_session.ended_at = datetime.utcnow()
        db.commit()
        db.refresh(db_session)
    return db_session

# Transcript operations
def create_transcript(db: Session, transcript: schemas.TranscriptCreate):
    db_transcript = models.Transcript(
        session_id=transcript.session_id,
        speaker=transcript.speaker,
        text=transcript.text,
        audio_path=transcript.audio_path,
        latency_ms=transcript.latency_ms
    )
    db.add(db_transcript)
    db.commit()
    db.refresh(db_transcript)
    return db_transcript

def get_transcripts_by_session(db: Session, session_id: str):
    return db.query(models.Transcript).filter(models.Transcript.session_id == session_id).order_by(models.Transcript.created_at.asc()).all()

# Prompt Template operations
def get_prompt_template(db: Session, bot_name: str):
    return db.query(models.PromptTemplate).filter(models.PromptTemplate.bot_name == bot_name).first()

def create_or_update_prompt_template(db: Session, prompt: schemas.PromptTemplateCreate):
    db_prompt = get_prompt_template(db, prompt.bot_name)
    if db_prompt:
        db_prompt.system_prompt = prompt.system_prompt
        db_prompt.updated_at = datetime.utcnow()
    else:
        db_prompt = models.PromptTemplate(bot_name=prompt.bot_name, system_prompt=prompt.system_prompt)
        db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    return db_prompt
