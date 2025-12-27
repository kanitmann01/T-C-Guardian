from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict
from app.services.ingestion_service import IngestionService
from app.core.logging import logger

router = APIRouter(prefix="/ingest", tags=["ingestion"])


@router.post("/file")
async def ingest_file(file: UploadFile = File(...)) -> Dict:
    """
    Extract text from uploaded file (PDF or DOCX).
    
    Returns:
        Dictionary with status, text_length, preview, and full text
    """
    try:
        service = IngestionService()
        text = await service.extract_text_from_file(file)
        
        return {
            "status": "success",
            "text_length": len(text),
            "preview": text[:200] if len(text) > 200 else text,
            "text": text
        }
    except Exception as e:
        logger.error(f"File ingestion error: {e}", exc_info=True)
        raise HTTPException(
            status_code=400,
            detail=f"Failed to process file: {str(e)}"
        )


@router.post("/url")
async def ingest_url(url: str) -> Dict:
    """
    Extract text from URL by web scraping.
    
    Args:
        url: The URL to scrape
    
    Returns:
        Dictionary with status, text_length, preview, and full text
    """
    try:
        service = IngestionService()
        text = service.extract_text_from_url(url)
        
        return {
            "status": "success",
            "text_length": len(text),
            "preview": text[:200] if len(text) > 200 else text,
            "text": text
        }
    except Exception as e:
        logger.error(f"URL ingestion error: {e}", exc_info=True)
        raise HTTPException(
            status_code=400,
            detail=f"Failed to scrape URL: {str(e)}"
        )
