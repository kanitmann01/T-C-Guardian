"""
Jurisdiction enumeration for legal analysis.
"""
from enum import Enum


class Jurisdiction(str, Enum):
    """Supported jurisdictions for legal analysis."""
    US_CALIFORNIA = "US_CALIFORNIA"
    EU_GDPR = "EU_GDPR"
    INDIA_IT_ACT = "INDIA_IT_ACT"
    
    @classmethod
    def get_legal_references(cls, jurisdiction: "Jurisdiction") -> str:
        """
        Get jurisdiction-specific legal references for prompts.
        
        Args:
            jurisdiction: The jurisdiction enum value
            
        Returns:
            String with legal references for the prompt
        """
        references = {
            cls.US_CALIFORNIA: (
                "California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA). "
                "Flag any sale of personal data without opt-out as HIGH SEVERITY (8-10). "
                "Arbitration clauses that waive class action rights are suspect under California law. "
                "Auto-renewal clauses must have clear cancellation mechanisms per California law."
            ),
            cls.EU_GDPR: (
                "General Data Protection Regulation (GDPR). "
                "Flag any data processing without explicit consent as HIGH SEVERITY (8-10). "
                "Right to erasure (Article 17) violations are critical. "
                "Data portability rights (Article 20) must be respected. "
                "Any clause limiting GDPR rights is likely unenforceable."
            ),
            cls.INDIA_IT_ACT: (
                "Information Technology Act, 2000 and IT Rules. "
                "Flag any clause that violates data protection principles as HIGH SEVERITY (7-10). "
                "Unauthorized access to personal data is a criminal offense. "
                "Companies must have reasonable security practices (Section 43A). "
                "Any clause attempting to limit liability for data breaches is suspect."
            ),
        }
        return references.get(jurisdiction, "General consumer protection laws apply.")

