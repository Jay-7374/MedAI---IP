import os
from dotenv import load_dotenv

# Find the .env file in the current directory or parent directory
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"), override=True)


class Settings:
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL")

    # LLM (Groq)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY")

    # ElevenLabs TTS
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY")

    # Twilio Telephony
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER")

    # Default patient number used when a request doesn't pass one explicitly.
    # On a Twilio TRIAL account this MUST be a Verified Caller ID or sends/calls will fail.
    DEFAULT_PATIENT_PHONE: str = os.getenv("DEFAULT_PATIENT_PHONE")

    # Public base URL of this backend, used so Twilio can fetch TwiML webhooks.
    # e.g. an ngrok URL like https://abcd1234.ngrok-free.app
    PUBLIC_BASE_URL: str = os.getenv("PUBLIC_BASE_URL")


settings = Settings()
