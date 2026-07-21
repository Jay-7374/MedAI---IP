import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

# Find the .env file in the current directory or parent directory
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"), override=True)


class Settings(BaseSettings):
    # Database
    DATABASE_URL: Optional[str] = None

    # LLM (Groq)
    GROQ_API_KEY: Optional[str] = None

    # ElevenLabs TTS
    ELEVENLABS_API_KEY: Optional[str] = None

    # Twilio Telephony
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None

    # Default patient number used when a request doesn't pass one explicitly.
    DEFAULT_PATIENT_PHONE: Optional[str] = None

    # Public base URL of this backend, used so Twilio can fetch TwiML webhooks.
    PUBLIC_BASE_URL: Optional[str] = None

    # Chatbot Configuration
    MAX_CONTEXT_MESSAGES: int = 20
    SUMMARY_THRESHOLD: int = 100
    MAX_UPLOAD_SIZE_MB: int = 5
    VISION_MODEL: str = "llama-3.2-11b-vision-preview"
    TEXT_MODEL: str = "llama-3.3-70b-versatile"
    STREAM_TIMEOUT_SEC: int = 15
    SUPPORTED_LANGUAGES: List[str] = [
        "Arabic", "Bengali", "Bulgarian", "Chinese (Simplified)", "Chinese (Traditional)",
        "Croatian", "Czech", "Danish", "Dutch", "English", "Estonian", "Finnish",
        "French", "German", "Greek", "Hebrew", "Hindi", "Hungarian", "Indonesian",
        "Italian", "Japanese", "Korean", "Latvian", "Lithuanian", "Malay", "Norwegian",
        "Persian", "Polish", "Portuguese", "Romanian", "Russian", "Serbian", "Slovak",
        "Slovenian", "Spanish", "Swahili", "Swedish", "Tagalog", "Tamil", "Telugu",
        "Thai", "Turkish", "Ukrainian", "Urdu", "Vietnamese"
    ]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
