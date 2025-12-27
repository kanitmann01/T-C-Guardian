import os
import json
from typing import Optional

# Global Config Variables
GOOGLE_API_KEY: Optional[str] = None
FIREBASE_CREDENTIALS: Optional[str] = None

def load_config():
    """
    Loads configuration from secrets.json or Environment Variables.
    Prioritizes secrets.json for local development override.
    """
    global GOOGLE_API_KEY
    
    # Try loading from secrets.json
    try:
        secrets_path = os.path.join(os.path.dirname(__file__), "secrets.json")
        if os.path.exists(secrets_path):
            with open(secrets_path, "r") as f:
                secrets = json.load(f)
                GOOGLE_API_KEY = secrets.get("google_api_key")
                # Add other secrets here if needed
                print("Configuration loaded from secrets.json")
    except Exception as e:
        print(f"Warning: Failed to load secrets.json: {e}")

    # Fallback to Environment Variables
    if not GOOGLE_API_KEY:
        GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

    if not GOOGLE_API_KEY:
        print("WARNING: GOOGLE_API_KEY is not set. AI features will fail.")

# Initialize config on module import (or can be called explicitly)
load_config()
