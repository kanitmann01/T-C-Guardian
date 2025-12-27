from pydantic import BaseModel
from typing import List, Optional

class ClauseAnalysis(BaseModel):
    id: str
    clause_text: str
    category: str
    simplified_explanation: str
    severity_score: int
    legal_context: str
    actionable_step: str
    flags: List[str]

class AnalysisResult(BaseModel):
    document_summary: str
    overall_danger_score: int
    clauses: List[ClauseAnalysis]

class AnalysisResponse(BaseModel):
    analysis_result: AnalysisResult

class AnalyzeRequest(BaseModel):
    text: str
    jurisdiction: str = "US-CA" # Default to California

class ChatRequest(BaseModel):
    history: List[dict] # [{"role": "user", "parts": ["msg"]}, ...]
    current_question: str
    document_context: str # The full text of the contract

class ChatResponse(BaseModel):
    answer: str
