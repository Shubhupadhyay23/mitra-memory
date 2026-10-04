import os
import requests

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")

def generate_voice_confirmation(text: str) -> bytes:
    """
    Generates a voice confirmation audio byte stream using ElevenLabs.
    Returns None if ElevenLabs is not configured.
    """
    if not ELEVENLABS_API_KEY:
        return None
        
    try:
        url = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM" # Rachel voice id
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        }
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()
        return response.content
    except Exception as e:
        print(f"ElevenLabs API Error: {e}")
        return None
