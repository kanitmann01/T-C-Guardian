import os
import json
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment or secrets.json."""
    
    # API Keys
    google_api_key: Optional[str] = None
    firebase_credentials_path: Optional[str] = None
    
    # Application Settings
    api_title: str = "T&C Guardian API"
    api_version: str = "0.1.0"
    debug: bool = False
    
    # Rate Limiting
    rate_limit_duration: int = 60  # seconds
    rate_limit_requests: int = 20  # requests per duration
    
    # CORS
    cors_origins: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175"
    ]
    
    # AI Model Settings
    gemini_model_analysis: str = "gemini-flash-latest"
    gemini_model_chat: str = "gemini-1.5-pro"
    gemini_temperature: float = 0.2
    gemini_max_tokens: int = 8192
    
    # Document Processing
    max_pdf_pages: int = 50
    
    class Config:
        env_file = ".env"
        case_sensitive = False


def load_settings() -> Settings:
    """Load settings from secrets.json or environment variables."""
    settings = Settings()
    
    # Try loading from secrets.json first (for local development)
    try:
        secrets_path = os.path.join(os.path.dirname(__file__), "..", "..", "secrets.json")
        if os.path.exists(secrets_path):
            with open(secrets_path, "r") as f:
                secrets = json.load(f)
                if not settings.google_api_key:
                    settings.google_api_key = secrets.get("google_api_key")
                if not settings.firebase_credentials_path:
                    settings.firebase_credentials_path = secrets.get("firebase_credentials_path")
                print("Configuration loaded from secrets.json")
    except Exception as e:
        print(f"Warning: Failed to load secrets.json: {e}")
    
    # Validate required settings
    if not settings.google_api_key:
        print("WARNING: GOOGLE_API_KEY is not set. AI features will fail.")
    
    return settings


# Global settings instance
settings = load_settings()
