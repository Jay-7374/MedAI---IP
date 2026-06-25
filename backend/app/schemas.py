from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional


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

    class Config:
        from_attributes = True

    @field_validator("role", mode="before")
    @classmethod
    def get_role_name(cls, v):
        if hasattr(v, "role_name"):
            return v.role_name
        return v


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

    class Config:
        from_attributes = True


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

    class Config:
        from_attributes = True


class PromptTemplateBase(BaseModel):
    bot_name: str
    system_prompt: str


class PromptTemplateCreate(PromptTemplateBase):
    pass


class PromptTemplate(PromptTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
