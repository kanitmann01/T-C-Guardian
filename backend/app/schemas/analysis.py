from pydantic import BaseModel, Field
from typing import List, Optional

from app.schemas.jurisdiction import Jurisdiction


class ClauseAnalysis(BaseModel):
    """Individual clause analysis result."""
    id: str = Field(..., description="Unique identifier for the clause")
    clause_text: str = Field(..., description="The exact text from the contract")
    category: str = Field(..., description="Category: Data Rights, Arbitration, Financial, IP Ownership, etc.")
    simplified_explanation: str = Field(..., description="ELI5 explanation of what this means")
    severity_score: int = Field(..., ge=1, le=10, description="Severity score from 1 (Safe) to 10 (Predatory)")
    legal_context: str = Field(..., description="Explanation of why this matters based on jurisdiction")
    actionable_step: str = Field(..., description="Specific advice on what to do")
    flags: List[str] = Field(default_factory=list, description="Tags like 'Red Flag', 'Standard Boilerplate', etc.")


class AnalysisResult(BaseModel):
    """Complete analysis result for a document."""
    document_summary: str = Field(..., description="High-level summary of the entire document")
    overall_danger_score: int = Field(..., ge=0, le=100, description="Overall danger score from 0-100")
    clauses: List[ClauseAnalysis] = Field(default_factory=list, description="List of analyzed clauses")


class AnalysisResponse(BaseModel):
    """API response wrapper for analysis."""
    analysis_result: AnalysisResult


class AnalyzeRequest(BaseModel):
    """Request model for document analysis."""
    text: str = Field(..., description="The contract text to analyze")
    jurisdiction: Jurisdiction = Field(
        default=Jurisdiction.US_CALIFORNIA,
        description="User's jurisdiction for legal analysis"
    )
