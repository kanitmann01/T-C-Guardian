import json
import os
import google.generativeai as genai
from fastapi import HTTPException
from firebase_admin import firestore

from config import GOOGLE_API_KEY

# Configure Gemini
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

# Model Config
generation_config = {
  "temperature": 0.2,
  "top_p": 0.95,
  "top_k": 64,
  "max_output_tokens": 8192,
  "response_mime_type": "application/json",
}

model = genai.GenerativeModel(
  model_name="gemini-flash-latest",
  generation_config=generation_config,
)

SYSTEM_PROMPT = """
You are the "Paranoid Lawyer" Engine. Your goal is to protect consumers by analyzing Terms & Conditions (T&C) contracts.
Identify predatory clauses, hidden fees, data rights violations, and arbitration traps.

Analyze the provided contract text and return a JSON object following this EXACT schema:
{
  "analysis_result": {
    "document_summary": "High level summary (max 2 sentences)",
    "overall_danger_score": integer (0-100),
    "clauses": [
      {
        "id": "uuid-string",
        "clause_text": "Exact text from contract",
        "category": "Data Rights | Arbitration | Financial | IP Ownership | Other",
        "simplified_explanation": "ELI5 explanation",
        "severity_score": integer (1-10),
        "legal_context": "Why this matters (mention laws like GDPR/CCPA if relevant)",
        "actionable_step": "What to do (e.g. Opt-out)",
        "flags": ["Red Flag", "Standard"]
      }
    ]
  }
}
If the text is safe, return a low score. Be strict but fair.
"""

async def analyze_contract_text(text: str, jurisdiction: str = "US-CA") -> dict:
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="Server misconfigured: Missing API Key")

    # 1. Check Cache
    import hashlib
    import datetime
    from firebase_config import get_db
    
    db = get_db()
    text_hash = hashlib.sha256(text.encode('utf-8')).hexdigest()
    
    if db:
        try:
            cached_doc = db.collection("global_contracts").document(text_hash).get()
            if cached_doc.exists:
                data = cached_doc.to_dict()
                print(f"CACHE HIT: {text_hash}")
                # Increment access count (async if possible, but fire-and-forget here)
                db.collection("global_contracts").document(text_hash).update({
                    "access_count": firestore.Increment(1)
                })
                return data["cached_analysis"]
        except Exception as e:
            print(f"Cache lookup failed: {e}")

    # Enhanced Prompt with Jurisdiction
    jurisdiction_prompt = f"The user is located in: {jurisdiction}. Please cite relevant specific laws (e.g. CCPA/CPRA for California, GDPR for Europe) in the 'legal_context' fields where applicable."
    
    full_prompt = f"{SYSTEM_PROMPT}\n\n{jurisdiction_prompt}"

    try:
        chat_session = model.start_chat(
            history=[
                {
                    "role": "user",
                    "parts": [full_prompt],
                },
            ]
        )
        response = chat_session.send_message(f"Analyze this contract:\n\n{text}")
        
        # Parse JSON
        try:
            analysis_data = json.loads(response.text)
            
            # 2. Save to Cache
            if db and "analysis_result" in analysis_data:
                try:
                    db.collection("global_contracts").document(text_hash).set({
                        "hash_id": text_hash,
                        "company_name": "Unknown", # Could ask LLM to extract this
                        "document_title": "Uploaded Contract",
                        "last_analyzed": datetime.datetime.now(),
                        "cached_analysis": analysis_data,
                        "access_count": 1
                    })
                    print(f"CACHE SAVED: {text_hash}")
                except Exception as save_err:
                    print(f"Cache save failed: {save_err}")
                
            return analysis_data

        except json.JSONDecodeError:
            # Fallback cleanup if needed (Gemini usually reliable with MIME type set)
            return {"error": "Failed to parse JSON response", "raw": response.text}
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"AI Analysis Failed: {str(e)}. Returning FALLBACK response.")
        
        # Fallback Mock Response
        return {
            "analysis_result": {
                "document_summary": "⚠️ AI SERVICE UNAVAILABLE: This is a simulation. The AI service is currently experiencing high load or quota limits. We have detected typical predatory clauses for demonstration purposes.",
                "overall_danger_score": 85,
                "clauses": [
                    {
                        "id": "fallback_1",
                        "clause_text": "By using this service, you agree to grant us a worldwide, irrevocable license to all your content.",
                        "category": "IP Ownership",
                        "simplified_explanation": "You are giving them rights to use your content forever, anywhere.",
                        "severity_score": 8,
                        "legal_context": "Common in social media, but 'irrevocable' is aggressive.",
                        "actionable_step": "Request limitation to 'operating the service' only.",
                        "flags": ["Red Flag", "Fallback Data"]
                    },
                    {
                        "id": "fallback_2",
                        "clause_text": "We provide no warranty and are not liable for any damages.",
                        "category": "Liability",
                        "simplified_explanation": "They take no responsibility if things break or you lose money.",
                        "severity_score": 6,
                        "legal_context": "Standard disclaimer, but total exclusion may be void in some jurisdictions.",
                        "actionable_step": "Check local consumer protection laws.",
                        "flags": ["Standard", "Fallback Data"]
                    }
                ]
            }
        }
