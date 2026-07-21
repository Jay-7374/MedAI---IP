from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Date, Time, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role_name = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    password = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"))

    role = relationship("Role", back_populates="users")
    sessions = relationship("CallSession", back_populates="user")

    patient_profile = relationship("Patient", back_populates="user", uselist=False)
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)


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
    dob = Column(Date)
    phone_number = Column(String(20))
    ssn_last_4 = Column(String(4))
    insurance_provider = Column(String(100), nullable=True)
    policy_number = Column(String(100), nullable=True)
    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)

    user = relationship("User", back_populates="patient_profile")
    appointments = relationship("Appointment", back_populates="patient")
    medical_history = relationship("MedicalHistory", back_populates="patient")
    prescriptions = relationship("Prescription", back_populates="patient")
    lab_tests = relationship("LabTest", back_populates="patient")


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


class ChatbotSession(Base):
    __tablename__ = "chatbot_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(200), default="New Chat")
    language = Column(String(50), default="English")
    mode = Column(String(100), default="General Assistant")
    conversation_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
    messages = relationship("ChatbotMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatbotMessage.timestamp")
    documents = relationship("ChatbotDocument", back_populates="session", cascade="all, delete-orphan")


class ChatbotMessage(Base):
    __tablename__ = "chatbot_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chatbot_sessions.id", ondelete="CASCADE"))
    role = Column(String(50))  # 'user', 'assistant', 'system'
    content = Column(Text)
    status = Column(String(50), default="completed")  # 'sending', 'completed', 'failed'
    timestamp = Column(DateTime, default=datetime.utcnow)
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    model_used = Column(String(100), nullable=True)

    session = relationship("ChatbotSession", back_populates="messages")


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
    upload_time = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatbotSession", back_populates="documents")
