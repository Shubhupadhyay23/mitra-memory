import os
import requests
from typing import Dict, Any
from app.models.memory import Memory

BACKBOARD_API_KEY = os.getenv("BACKBOARD_API_KEY")
BACKBOARD_URL = "https://api.backboard.dev/v1/memories" # Hypothetical endpoint

def sync_memory_to_backboard(memory: Memory) -> None:
    """
    Syncs the created memory to the Backboard Memory API.
    Fails gracefully to local-only SQLite development if the key is missing or API fails.
    """
    if not BACKBOARD_API_KEY:
        print("BACKBOARD_API_KEY missing. Falling back to local development memory (SQLite).")
        return
        
    try:
        headers = {
            "Authorization": f"Bearer {BACKBOARD_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "content": memory.original_input,
            "source_type": memory.source_type,
            "extracted_data": {
                "people": memory.people or [],
                "topics": memory.topics or [],
                "dates": memory.dates or [],
                "actions": memory.actions or []
            }
        }
        
        # We fire-and-forget this sync so we don't block the user if Backboard is down
        response = requests.post(BACKBOARD_URL, json=payload, headers=headers, timeout=3)
        if response.status_code == 200 or response.status_code == 201:
            print("Successfully synced memory to Backboard!")
        else:
            print(f"Backboard API returned non-200 status: {response.status_code}. Using local fallback.")
            
    except requests.exceptions.RequestException as e:
        print(f"Backboard integration unavailable: {e}. Falling back to local memory.")
