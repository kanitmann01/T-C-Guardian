from fastapi import APIRouter, HTTPException, Depends
import google.generativeai as genai
from typing import List, Dict, Any, Optional

from app.schemas.chat import ChatRequest, ChatResponse
from app.core.config import settings
from app.core.dependencies import get_google_api_key
from app.core.logging import logger

router = APIRouter(prefix="/chat", tags=["chat"])

# Chat System Prompt
PROMPT_CONTEXT = """
You are T&C Guardian's "Ask the Contract" AI. 
Your job is to answer the user's questions strictly based on the provided Contract Text.
If the answer is not in the text, say "I cannot find that information in this document."
Be helpful, concise, and legal-savvy but easy to understand.
"""


@router.post("/", response_model=ChatResponse)
async def chat_with_contract(
    request: ChatRequest,
    api_key: Optional[str] = Depends(get_google_api_key)
) -> ChatResponse:
    """
    Chat with the contract using RAG (Retrieval Augmented Generation).
    
    Args:
        request: Contains conversation history, current question, and document context
        api_key: Google API key for Gemini
    
    Returns:
        ChatResponse with the AI's answer
    """
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Google API key is not configured. Chat feature unavailable."
        )
    
    try:
        # Configure Gemini
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(settings.gemini_model_chat)
        
        # Format conversation history
        history_formatted = []
        for msg in request.history:
            role = msg.get("role")
            parts = msg.get("parts", [])
            if role and parts:
                history_formatted.append({
                    "role": role,
                    "parts": parts
                })
        
        # Construct full message with context
        full_message = (
            f"Contract Context:\n{request.document_context}\n\n"
            f"User Question: {request.current_question}"
        )
        
        # Start chat session with history
        chat = model.start_chat(history=history_formatted)
        
        # Send message with system prompt
        response = chat.send_message(f"{PROMPT_CONTEXT}\n\n{full_message}")
        
        return ChatResponse(answer=response.text)
    
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Chat failed: {str(e)}"
        )
