import os
import requests
from app.config import settings
import base64

def get_tts_audio_url(text: str, lang: str = "en") -> str:
    """
    Returns a URL for the audio. Since ElevenLabs requires POST for TTS with API key, 
    we either proxy it or return a URL to our own endpoint that generates it.
    For simplicity, we will return a relative URL to our backend which proxies to ElevenLabs,
    but here we'll just return a data URI for short responses to avoid setting up a new endpoint.
    Wait, data URIs for audio can be huge. Let's just create an endpoint on the backend.
    Actually, let's just encode it in base64 as a data URI for simplicity.
    """
    audio_bytes = get_tts_audio_bytes(text)
    if audio_bytes:
        b64 = base64.b64encode(audio_bytes).decode('utf-8')
        return f"data:audio/mpeg;base64,{b64}"
    
    # Fallback to empty
    return ""

def get_tts_audio_bytes(text: str, voice_id: str = "EXAVITQu4vr4xnSDxMaL") -> bytes:
    """
    Generate audio bytes using ElevenLabs API.
    """
    api_key = getattr(settings, "ELEVENLABS_API_KEY", None)
    if not api_key:
        # Fallback to Google TTS if no ElevenLabs key
        return _google_tts_fallback(text)
        
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": api_key
    }
    
    data = {
        "text": text,
        "model_id": "eleven_turbo_v2_5",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5
        }
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            return response.content
        else:
            print(f"ElevenLabs Error: {response.text}")
            return _google_tts_fallback(text)
    except Exception as e:
        print(f"ElevenLabs Exception: {e}")
        return _google_tts_fallback(text)


def _google_tts_fallback(text: str, lang: str = "en") -> bytes:
    """Fallback Google TTS."""
    import urllib.parse
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36"
    }

    chunks = []
    current_chunk = ""
    for word in text.split(" "):
        if len(current_chunk) + len(word) + 1 > 100:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = word + " "
        else:
            current_chunk += word + " "
    if current_chunk:
        chunks.append(current_chunk.strip())

    audio_data = bytearray()
    for chunk in chunks:
        if not chunk:
            continue
        encoded = urllib.parse.quote(chunk)
        url = f"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl={lang}&q={encoded}"
        try:
            r = requests.get(url, headers=headers)
            if r.status_code == 200:
                audio_data.extend(r.content)
        except Exception as e:
            print(f"Error fetching TTS chunk: {e}")

    return bytes(audio_data)
