from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Date, Time, Float, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

import uuid
from .database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role_name = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    password = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"))

    role = relationship("Role", back_populates="users")
    sessions = relationship("CallSession", back_populates="user")

    patient_profile = relationship("Patient", back_populates="user", uselist=False)
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)
    health_metrics = relationship("HealthMetric", back_populates="user", cascade="all, delete-orphan")


class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    description = Column(Text, nullable=True)

    doctors = relationship("Doctor", back_populates="department")


class Doctor(Base):
    __tablename__ = "doctors"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    department_id = Column(Integer, ForeignKey("departments.id"))
    specialty = Column(String(100))

    user = relationship("User", back_populates="doctor_profile")
    department = relationship("Department", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")


class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    full_name = Column(String(150), nullable=True)
    dob = Column(Date, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    blood_group = Column(String(10), nullable=True)
    height = Column(String(50), nullable=True)
    weight = Column(String(50), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    insurance_provider = Column(String(100), nullable=True)
    insurance_id = Column(String(100), nullable=True)
    medical_conditions = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    emergency_name = Column(String(100), nullable=True)
    emergency_relation = Column(String(100), nullable=True)
    emergency_phone = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="patient_profile")
    appointments = relationship("Appointment", back_populates="patient")
    medical_history = relationship("MedicalHistory", back_populates="patient")
    prescriptions = relationship("Prescription", back_populates="patient")
    lab_tests = relationship("LabTest", back_populates="patient")
    medicines = relationship("Medicine", back_populates="patient")

class Medicine(Base):
    __tablename__ = "medicines"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    patient_id = Column(Integer, ForeignKey("patients.id"))
    medicine_name = Column(String(150), nullable=False)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)
    time = Column(String(50), nullable=True)
    before_after_food = Column(String(50), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User")
    patient = relationship("Patient", back_populates="medicines")


class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    date = Column(Date)
    time = Column(Time)
    status = Column(String(50), default="Scheduled") # Scheduled, Completed, Cancelled
    symptoms = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")


class MedicalHistory(Base):
    __tablename__ = "medical_history"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    condition = Column(String(200))
    diagnosis_date = Column(Date)
    notes = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="medical_history")


class Prescription(Base):
    __tablename__ = "prescriptions"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    medication_name = Column(String(100))
    dosage = Column(String(50))
    frequency = Column(String(100))
    purpose = Column(String(200), nullable=True)
    side_effects = Column(Text, nullable=True)
    status = Column(String(50), default="Active")

    patient = relationship("Patient", back_populates="prescriptions")


class LabTest(Base):
    __tablename__ = "lab_tests"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    test_name = Column(String(100))
    date = Column(Date)
    result = Column(String(200), nullable=True)
    status = Column(String(50), default="Pending")

    patient = relationship("Patient", back_populates="lab_tests")


class CallSession(Base):
    __tablename__ = "call_sessions"

    id = Column(String(100), primary_key=True, index=True)  # UUID or Call SID
    user_id = Column(Integer, ForeignKey("users.id"))
    channel = Column(String(50))  # 'WebRTC' or 'Telephony'
    status = Column(String(50), default="Active")
    started_at = Column(DateTime, default=utc_now)
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
    created_at = Column(DateTime, default=utc_now)

    session = relationship("CallSession", back_populates="transcripts")


class PromptTemplate(Base):
    __tablename__ = "prompt_templates"

    id = Column(Integer, primary_key=True, index=True)
    bot_name = Column(String(100), unique=True, index=True)
    system_prompt = Column(Text)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(
        DateTime, default=utc_now, onupdate=utc_now
    )


class ChatbotSession(Base):
    __tablename__ = "chatbot_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(200), default="New Chat")
    language = Column(String(50), default="English")
    mode = Column(String(100), default="General Assistant")
    conversation_summary = Column(Text, nullable=True)
    summarized_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User")
    messages = relationship("ChatbotMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatbotMessage.timestamp")
    documents = relationship("ChatbotDocument", back_populates="session", cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_chatbot_sessions_user_id_updated_at', 'user_id', 'updated_at'),
    )


class ChatbotMessage(Base):
    __tablename__ = "chatbot_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chatbot_sessions.id", ondelete="CASCADE"))
    role = Column(String(50))  # 'user', 'assistant', 'system'
    content = Column(Text)
    status = Column(String(50), default="completed")  # 'sending', 'completed', 'failed'
    timestamp = Column(DateTime, default=utc_now)
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    model_used = Column(String(100), nullable=True)

    session = relationship("ChatbotSession", back_populates="messages")

    __table_args__ = (
        Index('ix_chatbot_messages_session_id_timestamp', 'session_id', 'timestamp'),
    )


class ChatbotDocument(Base):
    __tablename__ = "chatbot_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chatbot_sessions.id", ondelete="CASCADE"))
    filename = Column(String(255))
    mime_type = Column(String(100))
    file_size = Column(Integer)
    extracted_text = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    processing_status = Column(String(50), default="pending")  # 'pending', 'completed', 'failed'
    processing_duration_ms = Column(Integer, nullable=True)
    upload_time = Column(DateTime, default=utc_now)

    session = relationship("ChatbotSession", back_populates="documents")


class HealthMetric(Base):
    __tablename__ = "health_metrics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    metric_type = Column(String(50), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    source = Column(String(100), nullable=False, default="Health Connect")
    device_name = Column(String(100), nullable=True)
    synced_at = Column(DateTime, default=utc_now)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="health_metrics")

    __table_args__ = (
        Index('ix_health_metrics_user_id_metric_type', 'user_id', 'metric_type'),
        Index('ix_health_metrics_start_time', 'start_time'),
        Index('uix_health_metrics_unique_record', 'user_id', 'metric_type', 'start_time', 'end_time', 'source', unique=True),
    )

