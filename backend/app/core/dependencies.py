from typing import Optional
from firebase_admin import firestore
from app.core.config import settings
from app.core.logging import logger
from firebase_config import get_db


def get_database() -> Optional[firestore.Client]:
    """Dependency to get Firestore database client."""
    db = get_db()
    if not db:
        logger.warning("Firestore not available. Caching disabled.")
    return db


def get_google_api_key() -> Optional[str]:
    """Dependency to get Google API key."""
    if not settings.google_api_key:
        logger.warning("GOOGLE_API_KEY is not configured. Some features may be unavailable.")
    return settings.google_api_key
