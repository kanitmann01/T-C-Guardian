from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Union
from firebase_admin import firestore

from app.core.dependencies import get_database, get_google_api_key
from app.core.logging import logger
from app.schemas.analysis import ClauseAnalysis
from app.services.negotiation_service import NegotiationService

router = APIRouter(prefix="/negotiations", tags=["negotiations"])


# Request/Response Models
class NegotiationCreateLegacy(BaseModel):
    """Legacy request model for backward compatibility."""
    user_id: str = Field(..., description="User ID")
    document_title: str = Field(..., description="Title of the document")
    company_name: str = Field(..., description="Name of the company")
    clause_id: str = Field(..., description="ID of the contested clause")
    clause_text: str = Field(..., description="Text of the contested clause")
    issue_description: str = Field(..., description="Description of the issue")


class NegotiationCreate(BaseModel):
    """Request model for creating a new negotiation with full clause context."""
    user_id: str = Field(..., description="User ID")
    document_title: str = Field(..., description="Title of the document")
    company_name: str = Field(..., description="Name of the company")
    clause: ClauseAnalysis = Field(..., description="Full clause analysis object with all context")
    
    class Config:
        # This helps FastAPI distinguish this model from legacy
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "document_title": "Terms of Service",
                "company_name": "Example Corp",
                "clause": {
                    "id": "clause-123",
                    "clause_text": "Sample clause text",
                    "category": "Data Rights",
                    "simplified_explanation": "Explanation",
                    "severity_score": 7,
                    "legal_context": "Legal context",
                    "actionable_step": "Action to take",
                    "flags": ["Red Flag"]
                }
            }
        }


class NegotiationUpdate(BaseModel):
    """Request model for updating negotiation status."""
    status: str = Field(..., description="New status (draft_generated, sent, replied, resolved, ignored)")
    notes: Optional[str] = Field(None, description="Optional notes")


class EmailRequest(BaseModel):
    """Request model for generating email."""
    negotiation_id: str = Field(..., description="Negotiation ID")
    tone: str = Field(default="firm", description="Email tone: firm, polite, or aggressive")


@router.post("/create")
async def create_negotiation(
    data: dict,
    db: Optional[firestore.Client] = Depends(get_database)
) -> Dict:
    """
    Create a new negotiation/dispute for a contested clause.
    
    Accepts either:
    - Full ClauseAnalysis object (preferred, includes all context)
    - Legacy format (backward compatible)
    
    Returns:
        Dictionary with negotiation details including ID and status
    """
    service = NegotiationService(db=db)
    
    # Determine which format we're receiving by checking for 'clause' key
    # If 'clause' exists and is an object, use new format; otherwise use legacy
    try:
        if "clause" in data and isinstance(data["clause"], dict):
            # New format with full clause object
            try:
                negotiation_create = NegotiationCreate(**data)
                negotiation_data = service.clause_to_negotiation(
                    clause=negotiation_create.clause,
                    user_id=negotiation_create.user_id,
                    document_title=negotiation_create.document_title,
                    company_name=negotiation_create.company_name
                )
            except Exception as e:
                logger.error(f"Failed to parse NegotiationCreate: {e}", exc_info=True)
                raise HTTPException(
                    status_code=422,
                    detail=f"Invalid negotiation data: {str(e)}"
                )
        else:
            # Legacy format
            try:
                legacy_data = NegotiationCreateLegacy(**data)
                # Convert legacy format to ClauseAnalysis
                from app.schemas.analysis import ClauseAnalysis
                clause = ClauseAnalysis(
                    id=legacy_data.clause_id,
                    clause_text=legacy_data.clause_text,
                    category="Unknown",  # Legacy doesn't provide this
                    simplified_explanation=legacy_data.issue_description,
                    severity_score=5,  # Default
                    legal_context="Not provided",
                    actionable_step="Review and contest",
                    flags=[]
                )
                negotiation_data = service.clause_to_negotiation(
                    clause=clause,
                    user_id=legacy_data.user_id,
                    document_title=legacy_data.document_title,
                    company_name=legacy_data.company_name
                )
            except Exception as e:
                logger.error(f"Failed to parse NegotiationCreateLegacy: {e}", exc_info=True)
                raise HTTPException(
                    status_code=422,
                    detail=f"Invalid legacy negotiation data: {str(e)}"
                )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating negotiation: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create negotiation: {str(e)}"
        )
    
    # Save to database
    try:
        service.save_negotiation(negotiation_data)
    except Exception as e:
        logger.error(f"Failed to save negotiation to DB: {e}", exc_info=True)
        # Return in-memory version if DB fails
    
    return negotiation_data


@router.get("/")
async def list_negotiations(
    user_id: str = Query(..., description="User ID to filter negotiations"),
    db: firestore.Client = Depends(get_database)
) -> List[Dict]:
    """
    List all negotiations for a user.
    
    Args:
        user_id: User ID to filter by
    
    Returns:
        List of negotiation dictionaries
    """
    if not db:
        # Return mock data if DB unavailable
        return [
            {
                "id": "mock-1",
                "company_name": "Netflix",
                "status": "sent",
                "document_title": "Terms of Service",
                "clause_text": "Sample clause"
            }
        ]
    
    try:
        docs = db.collection("negotiations").where("user_id", "==", user_id).stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        logger.error(f"Failed to list negotiations: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve negotiations: {str(e)}"
        )


@router.post("/{negotiation_id}/generate-email")
async def generate_email(
    negotiation_id: str,
    request: EmailRequest,
    db: Optional[firestore.Client] = Depends(get_database),
    api_key: Optional[str] = Depends(get_google_api_key)
) -> Dict:
    """
    Generate an opt-out/contest email for a negotiation using full clause context.
    
    Args:
        negotiation_id: ID of the negotiation
        request: Contains tone preference
        db: Firestore database client
        api_key: Google API key for Gemini
    
    Returns:
        Dictionary with negotiation_id and generated email_content
    """
    service = NegotiationService(api_key=api_key, db=db)
    
    # Handle mock negotiations (when DB is unavailable)
    if negotiation_id == "mock-1":
        # Create mock negotiation data for demonstration
        from app.schemas.analysis import ClauseAnalysis
        mock_clause = ClauseAnalysis(
            id="mock-clause-1",
            clause_text="Binding Arbitration: You agree to arbitrate all disputes and waive class action rights.",
            category="Arbitration",
            simplified_explanation="You cannot sue in court and must use private arbitration instead.",
            severity_score=8,
            legal_context="This limits your legal rights and may be unenforceable in some jurisdictions.",
            actionable_step="Request to opt-out of arbitration clause within 30 days.",
            flags=["Red Flag", "Limits Legal Rights"]
        )
        negotiation_data = {
            "id": "mock-1",
            "user_id": "user_123",
            "company_name": "Netflix",
            "document_title": "Terms of Service",
            "clause_contested": "mock-clause-1",
            "clause_text": mock_clause.clause_text,
            "clause_category": mock_clause.category,
            "clause_severity_score": mock_clause.severity_score,
            "clause_legal_context": mock_clause.legal_context,
            "clause_actionable_step": mock_clause.actionable_step,
            "clause_simplified_explanation": mock_clause.simplified_explanation,
            "clause_flags": mock_clause.flags,
            "status": "draft_created"
        }
    else:
        # Fetch negotiation data from database
        negotiation_data = service.get_negotiation(negotiation_id)
        if not negotiation_data:
            raise HTTPException(
                status_code=404,
                detail=f"Negotiation {negotiation_id} not found"
            )
    
    # Reconstruct ClauseAnalysis from stored data (if available)
    # This allows us to use the enhanced email generation
    try:
        from app.schemas.analysis import ClauseAnalysis
        
        clause = ClauseAnalysis(
            id=negotiation_data.get("clause_contested", negotiation_id),
            clause_text=negotiation_data.get("clause_text", ""),
            category=negotiation_data.get("clause_category", "Unknown"),
            simplified_explanation=negotiation_data.get("clause_simplified_explanation", ""),
            severity_score=negotiation_data.get("clause_severity_score", 5),
            legal_context=negotiation_data.get("clause_legal_context", ""),
            actionable_step=negotiation_data.get("clause_actionable_step", ""),
            flags=negotiation_data.get("clause_flags", [])
        )
        
        company_name = negotiation_data.get("company_name", "The Company")
        
        # Generate email with full context
        email_content = service.generate_email_content(
            clause=clause,
            company_name=company_name,
            tone=request.tone
        )
        
        # Save draft to database (skip for mock negotiations)
        if negotiation_id != "mock-1":
            service.update_negotiation_email(negotiation_id, email_content)
        else:
            logger.info("Skipping DB save for mock negotiation")
        
        return {
            "negotiation_id": negotiation_id,
            "email_content": email_content
        }
    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Email generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate email: {str(e)}"
        )
