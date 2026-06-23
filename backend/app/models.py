from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    password_hash = Column(String(255), nullable=True)
    role = Column(String(50), default="Patient")
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("CallSession", back_populates="user")


class CallSession(Base):
    __tablename__ = "call_sessions"

    id = Column(String(100), primary_key=True, index=True)  # UUID or Call SID
    user_id = Column(Integer, ForeignKey("users.id"))
    channel = Column(String(50))  # 'WebRTC' or 'Telephony'
    status = Column(String(50), default="Active")
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="sessions")
    transcripts = relationship(
        "Transcript", back_populates="session", cascade="all, delete-orphan"
    )


class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(
        String(100), ForeignKey("call_sessions.id", ondelete="CASCADE")
    )
    speaker = Column(String(50))  # 'User' or 'AI'
    text = Column(Text)
    audio_path = Column(String(255), nullable=True)
    latency_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("CallSession", back_populates="transcripts")


class PromptTemplate(Base):
    __tablename__ = "prompt_templates"

    id = Column(Integer, primary_key=True, index=True)
    bot_name = Column(String(100), unique=True, index=True)
    system_prompt = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
