from pydantic import BaseModel, field_validator, ConfigDict
from datetime import datetime, date, time
from typing import Optional, List


class UserBase(BaseModel):
    name: str
    email: str


class UserCreate(UserBase):
    password: str
    role: Optional[str] = "patient"


class UserLogin(BaseModel):
    username: str
    password: str


class User(UserBase):
    id: int
    role: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("role", mode="before")
    @classmethod
    def get_role_name(cls, v):
        if hasattr(v, "role_name"):
            return v.role_name
        return v


class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None

class Department(DepartmentBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class DoctorBase(BaseModel):
    specialty: str

class Doctor(DoctorBase):
    id: int
    user_id: int
    department_id: int
    user: User
    department: Department
    model_config = ConfigDict(from_attributes=True)


class PatientBase(BaseModel):
    full_name: Optional[str] = None
    dob: Optional[date] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_id: Optional[str] = None
    medical_conditions: Optional[str] = None
    allergies: Optional[str] = None
    emergency_name: Optional[str] = None
    emergency_relation: Optional[str] = None
    emergency_phone: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class Patient(PatientBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class MedicineBase(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    time: Optional[str] = None
    before_after_food: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None

class MedicineCreate(MedicineBase):
    pass

class Medicine(MedicineBase):
    id: int
    user_id: int
    patient_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class AppointmentBase(BaseModel):
    date: date
    time: time
    symptoms: Optional[str] = None
    status: Optional[str] = "Scheduled"

class AppointmentCreate(AppointmentBase):
    doctor_id: int

class Appointment(AppointmentBase):
    id: int
    patient_id: int
    doctor_id: int
    model_config = ConfigDict(from_attributes=True)


class PrescriptionBase(BaseModel):
    medication_name: str
    dosage: str
    frequency: str
    purpose: Optional[str] = None
    side_effects: Optional[str] = None
    status: Optional[str] = "Active"

class PrescriptionCreate(PrescriptionBase):
    patient_id: int

class Prescription(PrescriptionBase):
    id: int
    patient_id: int
    model_config = ConfigDict(from_attributes=True)


class CallSessionBase(BaseModel):
    id: str
    user_id: Optional[int] = None
    channel: str
    status: Optional[str] = "Active"


class CallSessionCreate(CallSessionBase):
    pass


class CallSession(CallSessionBase):
    started_at: datetime
    ended_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TranscriptBase(BaseModel):
    session_id: str
    speaker: str
    text: str
    audio_path: Optional[str] = None
    latency_ms: Optional[int] = None


class TranscriptCreate(TranscriptBase):
    pass


class Transcript(TranscriptBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PromptTemplateBase(BaseModel):
    bot_name: str
    system_prompt: str


class PromptTemplateCreate(PromptTemplateBase):
    pass


class PromptTemplate(PromptTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

from uuid import UUID

class ChatbotMessageBase(BaseModel):
    role: str
    content: str
    status: Optional[str] = "completed"
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    latency_ms: Optional[int] = None
    model_used: Optional[str] = None

class ChatbotMessageCreate(ChatbotMessageBase):
    language: Optional[str] = None
    mode: Optional[str] = None

    @field_validator("content")
    @classmethod
    def validate_content(cls, v):
        if not v or not v.strip():
            raise ValueError("Message content cannot be empty or whitespace only.")
        if len(v) > 5000:
            raise ValueError("Message content exceeds maximum allowed length.")
        return v
    
    @field_validator("language")
    @classmethod
    def validate_language(cls, v):
        from app.config import settings
        if v and v not in settings.SUPPORTED_LANGUAGES:
            raise ValueError(f"Unsupported language. Supported options are listed in config.")
        return v
        
    @field_validator("mode")
    @classmethod
    def validate_mode(cls, v):
        valid_modes = ["General Assistant", "Symptom Checker", "Medicine Guide"]
        if v and v not in valid_modes:
            raise ValueError(f"Unsupported mode: {v}. Must be one of {valid_modes}")
        return v

class ChatbotMessage(ChatbotMessageBase):
    id: UUID
    session_id: UUID
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatbotDocumentBase(BaseModel):
    filename: str
    mime_type: str
    file_size: int
    extracted_text: Optional[str] = None
    summary: Optional[str] = None
    processing_status: Optional[str] = "pending"
    processing_duration_ms: Optional[int] = None

class ChatbotDocumentCreate(ChatbotDocumentBase):
    pass

class ChatbotDocument(ChatbotDocumentBase):
    id: UUID
    session_id: UUID
    upload_time: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatbotSessionBase(BaseModel):
    title: Optional[str] = "New Chat"
    language: Optional[str] = "English"
    mode: Optional[str] = "General Assistant"
    conversation_summary: Optional[str] = None

class ChatbotSessionCreate(ChatbotSessionBase):
    pass

class ChatbotSessionList(ChatbotSessionBase):
    id: UUID
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChatbotSession(ChatbotSessionBase):
    id: UUID
    user_id: int
    created_at: datetime
    updated_at: datetime
    messages: list[ChatbotMessage] = []
    documents: list[ChatbotDocument] = []

    model_config = ConfigDict(from_attributes=True)


class HealthMetricBase(BaseModel):
    metric_type: str
    value: float
    unit: str
    start_time: datetime
    end_time: datetime
    source: Optional[str] = "Health Connect"
    device_name: Optional[str] = None

    @field_validator("metric_type")
    @classmethod
    def validate_metric_type(cls, v):
        valid_metrics = ["HEART_RATE", "STEPS", "SLEEP", "SPO2"]
        if v not in valid_metrics:
            raise ValueError(f"Invalid metric_type: {v}. Must be one of {valid_metrics}")
        return v


class HealthMetricCreate(HealthMetricBase):
    pass


class HealthMetricBatchRequest(BaseModel):
    records: List[HealthMetricCreate]


class HealthMetric(HealthMetricBase):
    id: int
    user_id: int
    synced_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BatchUploadResponse(BaseModel):
    inserted: int
    duplicates: int
    failed: int


class HealthSyncStatus(BaseModel):
    status: str
    authenticated: bool
    backend_version: str
