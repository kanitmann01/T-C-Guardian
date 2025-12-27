from pydantic import BaseModel, Field
from typing import List, Dict, Any


class ChatMessage(BaseModel):
    """Single chat message in conversation history."""
    role: str = Field(..., description="Message role: 'user' or 'model'")
    parts: List[str] = Field(default_factory=list, description="Message content parts")


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    history: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Conversation history as list of message dicts with 'role' and 'parts'"
    )
    current_question: str = Field(..., description="The current user question")
    document_context: str = Field(..., description="The full text of the contract being discussed")


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    answer: str = Field(..., description="The AI's response to the question")
