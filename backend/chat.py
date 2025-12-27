from fastapi import APIRouter, HTTPException
import google.generativeai as genai
from models import ChatRequest, ChatResponse
import os
import json

router = APIRouter(prefix="/chat", tags=["chat"])

from config import GOOGLE_API_KEY

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

# Chat System Prompt
PROMPT_CONTEXT = """
You are T&C Guardian's "Ask the Contract" AI. 
Your job is to answer the user's questions strictly based on the provided Contract Text.
If the answer is not in the text, say "I cannot find that information in this document."
Be helpful, concise, and legal-savvy but easy to understand.
"""

@router.post("/", response_model=ChatResponse)
async def chat_with_contract(request: ChatRequest):
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="Missing API Key")

    try:
        model = genai.GenerativeModel("gemini-1.5-pro")
        
        # Construct the session
        # We start a chat session. 
        # For true RAG with large docs, we rely on Gemini's 1M context window.
        
        history_formatted = []
        for msg in request.history:
            history_formatted.append({
                "role": msg.get("role"),
                "parts": msg.get("parts")
            })

        # Inject context into the latest message or system instruction
        # A simple way for stateless: 
        # Message = "Control Context: \n ... \n Question: ..."
        
        full_message = f"Contract Context:\n{request.document_context}\n\nUser Question: {request.current_question}"

        chat = model.start_chat(history=history_formatted)
        
        # We send the unified prompt. 
        # Ideally, context is sent once, but for stateless REST API, sending it every time ensures consistency 
        # or we could rely on 'history' if the frontend preserves it.
        # Here we assume stateless per request on context, but history passed for continuity.
        
        response = chat.send_message(f"{PROMPT_CONTEXT}\n\n{full_message}")
        
        return ChatResponse(answer=response.text)

    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
