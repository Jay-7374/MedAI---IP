import urllib.parse
import requests


def get_tts_audio_url(text: str, lang: str = "en") -> str:
    """
    Get a direct public URL to play/stream the audio for the given text (client-side).
    """
    encoded_text = urllib.parse.quote(text[:100])
    return f"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl={lang}&q={encoded_text}"


def get_tts_audio_bytes(text: str, lang: str = "en") -> bytes:
    """
    Generate audio bytes from the public Google TTS service,
    splitting long text into 100-character chunks and merging the audio bytes.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36"
    }

    # Split text into chunks of <= 100 characters (preferring word boundaries)
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
