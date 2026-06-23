import io
from .llm import client


def transcribe_audio(audio_bytes: bytes, filename: str = "audio.wav") -> str:
    """
    Transcribe raw audio bytes using Groq's high-speed Whisper API.
    """
    if not client:
        return "STT engine is offline"

    try:
        # Create a file-like object from audio bytes
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = filename

        translation = client.audio.transcriptions.create(
            file=audio_file, model="whisper-large-v3", response_format="json"
        )
        return (
            translation.text
            if hasattr(translation, "text")
            else translation.get("text", "")
        )
    except Exception as e:
        print(f"STT transcription failed: {e}")
        return ""
