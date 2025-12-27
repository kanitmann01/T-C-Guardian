"""
Negotiation Service - Handles conversion from ClauseAnalysis to Negotiation objects
and enhanced email generation with full clause context.
"""
from typing import Dict, Optional
import datetime
import uuid
import google.generativeai as genai
from firebase_admin import firestore

from app.core.config import settings
from app.core.logging import logger
from app.schemas.analysis import ClauseAnalysis


class NegotiationService:
    """Service for managing negotiations and email generation."""
    
    def __init__(self, api_key: Optional[str] = None, db: Optional[firestore.Client] = None):
        """Initialize the negotiation service."""
        self.api_key = api_key or settings.google_api_key
        self.db = db
        
        if self.api_key:
            genai.configure(api_key=self.api_key)
    
    def clause_to_negotiation(
        self,
        clause: ClauseAnalysis,
        user_id: str,
        document_title: str,
        company_name: str
    ) -> Dict:
        """
        Convert a ClauseAnalysis object to a negotiation payload.
        
        Args:
            clause: The clause analysis object with full context
            user_id: User ID creating the negotiation
            document_title: Title of the document
            company_name: Name of the company
            
        Returns:
            Dictionary ready for Firestore storage
        """
        negotiation_id = str(uuid.uuid4())
        
        return {
            "id": negotiation_id,
            "user_id": user_id,
            "company_name": company_name,
            "document_title": document_title,
            "clause_contested": clause.id,
            "clause_text": clause.clause_text,
            # Store full clause context for reference
            "clause_category": clause.category,
            "clause_severity_score": clause.severity_score,
            "clause_legal_context": clause.legal_context,
            "clause_actionable_step": clause.actionable_step,
            "clause_simplified_explanation": clause.simplified_explanation,
            "clause_flags": clause.flags,
            "issue_description": f"Contesting {clause.category} clause (Severity: {clause.severity_score}/10)",
            "status": "draft_created",
            "created_at": datetime.datetime.now(),
            "last_updated": datetime.datetime.now()
        }
    
    def generate_email_content(
        self,
        clause: ClauseAnalysis,
        company_name: str,
        tone: str = "firm"
    ) -> str:
        """
        Generate email content with redline proposal (rewritten clause) using full clause context.
        
        Args:
            clause: Full ClauseAnalysis object with all context
            company_name: Name of the company
            tone: Email tone (firm, polite, aggressive)
            
        Returns:
            Generated email content as string with rewritten clause proposal
        """
        if not self.api_key:
            raise ValueError("Google API key is required for email generation")
        
        try:
            model = genai.GenerativeModel(settings.gemini_model_chat)
            
            # Enhanced prompt with redline feature - rewrite clause AND draft email
            prompt = f"""You are a consumer rights lawyer. Your task has TWO parts:

PART 1: REWRITE THE CLAUSE
Rewrite the following predatory clause to be fair and balanced, protecting consumer rights while maintaining the company's legitimate business interests.

ORIGINAL CLAUSE:
"{clause.clause_text}"

CLAUSE ANALYSIS:
- Category: {clause.category}
- Severity Score: {clause.severity_score}/10
- Explanation: {clause.simplified_explanation}
- Legal Context: {clause.legal_context}
- Recommended Action: {clause.actionable_step}
- Flags: {', '.join(clause.flags) if clause.flags else 'None'}

REQUIREMENTS FOR REWRITE:
- Maintain the company's legitimate business needs
- Remove predatory or one-sided language
- Add consumer protections and fair terms
- Make it balanced and enforceable
- Keep it concise and clear

PART 2: DRAFT THE EMAIL
Draft a {tone} but professional email to {company_name}'s legal department that:
1. Politely contests the original clause
2. Explains why it's problematic (cite the legal context)
3. Proposes your rewritten clause as a fair alternative
4. Requests they update their terms

FORMAT YOUR RESPONSE AS:

=== REWRITTEN CLAUSE ===
[Your rewritten, fair version of the clause here]

=== EMAIL ===
SUBJECT: [Subject line]

BODY:
[Professional email body here]

The email should be concise, cite relevant consumer protection laws, and propose the rewritten clause as a solution.
"""
            
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Email generation error: {e}", exc_info=True)
            raise ValueError(f"Failed to generate email: {str(e)}")
    
    def save_negotiation(self, negotiation_data: Dict) -> str:
        """
        Save negotiation to Firestore.
        
        Args:
            negotiation_data: Negotiation dictionary from clause_to_negotiation()
            
        Returns:
            Negotiation ID
        """
        if not self.db:
            logger.warning("DB not connected, negotiation not persisted")
            return negotiation_data["id"]
        
        try:
            doc_ref = self.db.collection("negotiations").document(negotiation_data["id"])
            doc_ref.set(negotiation_data)
            logger.info(f"Saved negotiation: {negotiation_data['id']}")
            return negotiation_data["id"]
        except Exception as e:
            logger.error(f"Failed to save negotiation: {e}", exc_info=True)
            raise
    
    def update_negotiation_email(
        self,
        negotiation_id: str,
        email_content: str
    ) -> None:
        """
        Update negotiation with generated email content.
        
        Args:
            negotiation_id: ID of the negotiation
            email_content: Generated email content
        """
        if not self.db:
            logger.warning("DB not connected, email draft not persisted")
            return
        
        try:
            self.db.collection("negotiations").document(negotiation_id).update({
                "email_content": email_content,
                "status": "draft_generated",
                "last_updated": datetime.datetime.now()
            })
            logger.info(f"Updated negotiation {negotiation_id} with email draft")
        except Exception as e:
            logger.error(f"Failed to update negotiation email: {e}", exc_info=True)
            raise
    
    def get_negotiation(self, negotiation_id: str) -> Optional[Dict]:
        """
        Retrieve negotiation from Firestore.
        
        Args:
            negotiation_id: ID of the negotiation
            
        Returns:
            Negotiation dictionary or None if not found
        """
        if not self.db:
            return None
        
        try:
            doc = self.db.collection("negotiations").document(negotiation_id).get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            logger.warning(f"Failed to fetch negotiation: {e}")
            return None

