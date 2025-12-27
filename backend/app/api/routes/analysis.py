from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Optional
from firebase_admin import firestore

from app.schemas.analysis import AnalyzeRequest, AnalysisResponse
from app.services.analysis_service import AnalysisService
from app.core.dependencies import get_database, get_google_api_key
from app.core.logging import logger

router = APIRouter(prefix="/analyze", tags=["analysis"])


@router.post("/", response_model=AnalysisResponse)
async def analyze_document(
    request: AnalyzeRequest,
    db: Optional[firestore.Client] = Depends(get_database),
    api_key: Optional[str] = Depends(get_google_api_key)
) -> AnalysisResponse:
    """
    Analyze contract text and return structured analysis with danger scores and clause breakdown.
    
    This endpoint is publicly accessible (no authentication required).
    Analysis results are cached in Firestore using SHA-256 hash to save API costs,
    but no user-specific data is stored.
    
    Args:
        request: Contains text and jurisdiction
        db: Firestore database client (optional, for caching)
        api_key: Google API key for Gemini
    
    Returns:
        AnalysisResponse with document summary, danger score, and clause analysis
    """
    try:
        service = AnalysisService(api_key=api_key, db=db)
        result = await service.analyze_contract_text(
            text=request.text,
            jurisdiction=request.jurisdiction
        )
        
        # Validate response structure
        if "analysis_result" not in result:
            raise HTTPException(
                status_code=500,
                detail="Invalid response structure from analysis service"
            )
        
        # Note: No user history is saved server-side.
        # History is managed client-side using sessionStorage.
        # Firestore caching (global_contracts) is still used to save API costs.
        
        return AnalysisResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )
