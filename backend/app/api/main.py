from fastapi import APIRouter
from app.api.routes import ingestion, analysis, chat, negotiations

# Create main API router
api_router = APIRouter()

# Include all route modules
api_router.include_router(ingestion.router)
api_router.include_router(analysis.router)
api_router.include_router(chat.router)
api_router.include_router(negotiations.router)
