import json
import hashlib
import datetime
import uuid
from typing import Dict, Optional
import google.generativeai as genai
from firebase_admin import firestore

from app.core.config import settings
from app.core.exceptions import AnalysisException, ConfigurationException
from app.core.logging import logger
from app.schemas.analysis import AnalysisResponse
from app.schemas.jurisdiction import Jurisdiction


class AnalysisService:
    """Service for analyzing contract text using AI."""
    
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
    
    def __init__(self, api_key: Optional[str] = None, db: Optional[firestore.Client] = None):
        """Initialize the analysis service."""
        self.api_key = api_key or settings.google_api_key
        self.db = db
        
        if not self.api_key:
            logger.warning("Google API key not configured. Analysis will use fallback responses.")
        else:
            genai.configure(api_key=self.api_key)
        
        # Model configuration
        self.generation_config = {
            "temperature": settings.gemini_temperature,
            "top_p": 0.95,
            "top_k": 64,
            "max_output_tokens": settings.gemini_max_tokens,
            "response_mime_type": "application/json",
        }
        
        self.model = genai.GenerativeModel(
            model_name=settings.gemini_model_analysis,
            generation_config=self.generation_config,
        ) if self.api_key else None
    
    def _get_text_hash(self, text: str) -> str:
        """Generate SHA-256 hash of text for caching."""
        return hashlib.sha256(text.encode('utf-8')).hexdigest()
    
    def _check_cache(self, text_hash: str) -> Optional[Dict]:
        """Check if analysis exists in cache."""
        if not self.db:
            return None
        
        try:
            cached_doc = self.db.collection("global_contracts").document(text_hash).get()
            if cached_doc.exists:
                data = cached_doc.to_dict()
                logger.info(f"CACHE HIT: {text_hash}")
                
                # Increment access count (fire-and-forget)
                try:
                    self.db.collection("global_contracts").document(text_hash).update({
                        "access_count": firestore.Increment(1)
                    })
                except Exception as e:
                    logger.warning(f"Failed to increment cache access count: {e}")
                
                return data.get("cached_analysis")
        except Exception as e:
            logger.warning(f"Cache lookup failed: {e}")
        
        return None
    
    def _save_to_cache(self, text_hash: str, analysis_data: Dict):
        """Save analysis result to cache."""
        if not self.db:
            return
        
        try:
            self.db.collection("global_contracts").document(text_hash).set({
                "hash_id": text_hash,
                "company_name": "Unknown",  # Could ask LLM to extract this
                "document_title": "Uploaded Contract",
                "last_analyzed": datetime.datetime.now(),
                "cached_analysis": analysis_data,
                "access_count": 1
            })
            logger.info(f"CACHE SAVED: {text_hash}")
        except Exception as e:
            logger.warning(f"Cache save failed: {e}")
    
    def _get_fallback_response(self) -> Dict:
        """Generate fallback response when AI service is unavailable."""
        return {
            "analysis_result": {
                "document_summary": "⚠️ AI SERVICE UNAVAILABLE: This is a simulation. The AI service is currently experiencing high load or quota limits. We have detected typical predatory clauses for demonstration purposes.",
                "overall_danger_score": 85,
                "clauses": [
                    {
                        "id": str(uuid.uuid4()),
                        "clause_text": "By using this service, you agree to grant us a worldwide, irrevocable license to all your content.",
                        "category": "IP Ownership",
                        "simplified_explanation": "You are giving them rights to use your content forever, anywhere.",
                        "severity_score": 8,
                        "legal_context": "Common in social media, but 'irrevocable' is aggressive.",
                        "actionable_step": "Request limitation to 'operating the service' only.",
                        "flags": ["Red Flag", "Fallback Data"]
                    },
                    {
                        "id": str(uuid.uuid4()),
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
    
    async def analyze_contract_text(
        self,
        text: str,
        jurisdiction: Jurisdiction = Jurisdiction.US_CALIFORNIA
    ) -> Dict:
        """
        Analyze contract text and return structured analysis.
        
        Args:
            text: The contract text to analyze
            jurisdiction: User's jurisdiction (e.g., US-CA, EU-GDPR, UK)
        
        Returns:
            Dictionary containing analysis_result with document_summary, 
            overall_danger_score, and clauses
        """
        if not text or not text.strip():
            raise AnalysisException("Contract text cannot be empty")
        
        # Check cache first
        text_hash = self._get_text_hash(text)
        cached_result = self._check_cache(text_hash)
        if cached_result:
            return cached_result
        
        # If no API key, return fallback
        if not self.api_key or not self.model:
            logger.warning("AI service unavailable, returning fallback response")
            return self._get_fallback_response()
        
        # Enhanced prompt with jurisdiction-specific legal references
        try:
            # Convert string to enum if needed (for backward compatibility)
            if isinstance(jurisdiction, str):
                # Map old string format to enum
                jurisdiction_map = {
                    "US-CA": Jurisdiction.US_CALIFORNIA,
                    "EU-GDPR": Jurisdiction.EU_GDPR,
                    "IN": Jurisdiction.INDIA_IT_ACT,
                }
                jurisdiction_enum = jurisdiction_map.get(jurisdiction.upper(), Jurisdiction.US_CALIFORNIA)
            else:
                jurisdiction_enum = jurisdiction
            
            legal_references = Jurisdiction.get_legal_references(jurisdiction_enum)
        except (AttributeError, ValueError):
            # Fallback if jurisdiction is not recognized
            jurisdiction_enum = Jurisdiction.US_CALIFORNIA
            legal_references = Jurisdiction.get_legal_references(jurisdiction_enum)
        
        jurisdiction_prompt = f"""
JURISDICTION: {jurisdiction_enum.value}

LEGAL FRAMEWORK:
{legal_references}

CRITICAL: When analyzing clauses, apply the above legal framework strictly. 
- If a clause violates the referenced laws, assign HIGH SEVERITY (7-10)
- Cite specific articles/sections in the 'legal_context' field
- Flag any attempt to limit or waive these legal rights as predatory
"""
        
        full_prompt = f"{self.SYSTEM_PROMPT}\n\n{jurisdiction_prompt}"
        
        try:
            # Start chat session
            chat_session = self.model.start_chat(
                history=[
                    {
                        "role": "user",
                        "parts": [full_prompt],
                    },
                ]
            )
            
            # Send analysis request
            response = chat_session.send_message(f"Analyze this contract:\n\n{text}")
            
            # Parse JSON response
            try:
                analysis_data = json.loads(response.text)
                
                # Validate structure
                if "analysis_result" not in analysis_data:
                    raise AnalysisException("Invalid response structure from AI model")
                
                # Save to cache
                self._save_to_cache(text_hash, analysis_data)
                
                return analysis_data
            
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {e}")
                logger.debug(f"Raw response: {response.text}")
                raise AnalysisException(f"Failed to parse AI response: {str(e)}")
        
        except Exception as e:
            logger.error(f"AI Analysis Failed: {str(e)}", exc_info=True)
            logger.warning("Returning fallback response due to AI service failure")
            
            # Return fallback on error
            fallback = self._get_fallback_response()
            return fallback
