from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import datetime
import uuid
import google.generativeai as genai
from firebase_config import get_db
from config import GOOGLE_API_KEY

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

router = APIRouter(prefix="/negotiations", tags=["negotiations"])

# Models
class NegotiationCreate(BaseModel):
    user_id: str
    document_title: str
    company_name: str
    clause_id: str
    clause_text: str
    issue_description: str

class NegotiationUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class EmailRequest(BaseModel):
    negotiation_id: str
    tone: str = "firm" # firm, polite, aggressive

# -- Helper Functions --

def _get_db_connection():
    """Wrapper to get database connection."""
    return get_db()

def _create_mock_negotiation(status: str, message: str) -> dict:
    """Creates a mock negotiation response when DB is unavailable."""
    return {"id": str(uuid.uuid4()), "status": status, "message": message}

def _get_negotiation_data(db, negotiation_id: str) -> Optional[dict]:
    """Fetches negotiation data from Firestore."""
    if not db:
        return None
    doc = db.collection("negotiations").document(negotiation_id).get()
    if doc.exists:
        return doc.to_dict()
    return None

def _generate_email_content_with_llm(clause_text: str, company_name: str, tone: str) -> str:
    """Generates email content using Google Gemini."""
    model = genai.GenerativeModel("gemini-1.5-pro")
    
    prompt = f"""
    Write a formal legal email to {company_name} to opt-out or contest the following clause:
    "{clause_text}"
    
    Tone: {tone}.
    My goal: Protect my consumer rights.
    Keep it concise, professional, and cite 'consumer protection laws' generally if specific jurisdiction is unknown.
    """
    
    response = model.generate_content(prompt)
    return response.text

def _save_email_draft(db, negotiation_id: str, email_content: str):
    """Updates the negotiation document with the generated email draft."""
    if db:
        db.collection("negotiations").document(negotiation_id).update({
            "email_content": email_content,
            "status": "draft_generated",
            "last_updated": datetime.datetime.now()
        })

# -- Routes --

@router.post("/create")
async def create_negotiation(data: NegotiationCreate):
    db = _get_db_connection()
    if not db:
        return _create_mock_negotiation("draft_created", "DB not connected, using in-memory mock")

    negotiation_id = str(uuid.uuid4())
    doc_ref = db.collection("negotiations").document(negotiation_id)
    
    new_negotiation = {
        "id": negotiation_id,
        "user_id": data.user_id,
        "company_name": data.company_name,
        "document_title": data.document_title,
        "clause_contested": data.clause_id,
        "clause_text": data.clause_text,
        "status": "draft_generated",
        "created_at": datetime.datetime.now(),
        "last_updated": datetime.datetime.now()
    }
    
    doc_ref.set(new_negotiation)
    return new_negotiation

@router.get("/")
async def list_negotiations(user_id: str):
    db = _get_db_connection()
    if not db:
         return [{"id": "mock-1", "company_name": "Netflix", "status": "sent"}]

    docs = db.collection("negotiations").where("user_id", "==", user_id).stream()
    return [doc.to_dict() for doc in docs]

@router.post("/{negotiation_id}/generate-email")
async def generate_email(negotiation_id: str, request: EmailRequest):
    # Fetch negotiation details
    db = _get_db_connection()
    
    # Default mock data
    clause_text = "Binding Arbitration: You agree to arbitrate all disputes and waive class action rights."
    company_name = "The Company"
    
    # Try to fetch real data
    data = _get_negotiation_data(db, negotiation_id)
    if data:
        clause_text = data.get("clause_text", clause_text)
        company_name = data.get("company_name", company_name)
    
    # Generate content
    email_content = _generate_email_content_with_llm(clause_text, company_name, request.tone)
    
    # Save draft
    _save_email_draft(db, negotiation_id, email_content)
        
    return {"negotiation_id": negotiation_id, "email_content": email_content}
