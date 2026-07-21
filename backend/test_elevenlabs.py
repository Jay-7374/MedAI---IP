"""Test a premade female voice on ElevenLabs free tier."""
import urllib.request
import json
import sys

API_KEY = "sk_35288ef34728b9989cb1b0bd03e8799bbf3e18879e197153"

# Sarah - Mature, Reassuring, Confident (premade, free-tier compatible)
VOICE_ID = "EXAVITQu4vr4xnSDxMaL"
URL = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

payload = json.dumps({
    "text": "Hello, welcome to the MedAI voice assistant. How can I help you today?",
    "model_id": "eleven_turbo_v2_5",
    "voice_settings": {
        "stability": 0.5,
        "similarity_boost": 0.5
    }
}).encode("utf-8")

headers = {
    "Accept": "audio/mpeg",
    "Content-Type": "application/json",
    "xi-api-key": API_KEY
}

req = urllib.request.Request(URL, data=payload, headers=headers, method="POST")

try:
    print(f"Testing ElevenLabs - Sarah voice (premade, free-tier)...")
    print(f"  Voice ID: {VOICE_ID}")
    
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = resp.read()
        print(f"\nSUCCESS!")
        print(f"  Status: {resp.status}")
        print(f"  Content-Type: {resp.headers.get('Content-Type', 'unknown')}")
        print(f"  Audio size: {len(data)} bytes ({len(data)/1024:.1f} KB)")
        
except urllib.error.HTTPError as e:
    body = e.read().decode("utf-8", errors="replace")
    print(f"\nFAILED - HTTP ERROR {e.code}: {body}")
    sys.exit(1)
except Exception as e:
    print(f"\nError: {e}")
    sys.exit(1)
