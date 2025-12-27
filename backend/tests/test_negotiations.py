import unittest
from unittest.mock import MagicMock, patch
from negotiations import (
    _generate_email_content_with_llm, 
    _get_negotiation_data, 
    generate_email, 
    EmailRequest
)
import asyncio

class TestNegotiations(unittest.TestCase):

    def test_generate_email_content_calls_llm(self):
        """Test that the helper function calls the LLM with the correct prompt structure."""
        with patch("negotiations.genai.GenerativeModel") as MockModel:
            mock_instance = MockModel.return_value
            mock_instance.generate_content.return_value.text = "Generated Email Content"
            
            clause = "No refunds"
            company = "Bad Corp"
            tone = "firm"
            
            result = _generate_email_content_with_llm(clause, company, tone)
            
            self.assertEqual(result, "Generated Email Content")
            MockModel.assert_called_with("gemini-1.5-pro")
            # Verify prompt contains key information
            call_args = mock_instance.generate_content.call_args[0][0]
            self.assertIn(clause, call_args)
            self.assertIn(company, call_args)
            self.assertIn(tone, call_args)

    def test_get_negotiation_data_db_missing(self):
        """Test behavior when DB is None."""
        result = _get_negotiation_data(None, "123")
        self.assertIsNone(result)

    def test_get_negotiation_data_found(self):
        """Test fetching data when document exists."""
        mock_db = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {"id": "123", "company_name": "Test Co"}
        
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc
        
        result = _get_negotiation_data(mock_db, "123")
        self.assertEqual(result, {"id": "123", "company_name": "Test Co"})

class TestAsyncNegotiations(unittest.IsolatedAsyncioTestCase):

    async def test_generate_email_route(self):
        """Test the full route logic with mocked DB and LLM helpers."""
        
        # Mock helpers to avoid side effects
        with patch("negotiations._get_db_connection") as mock_get_db, \
             patch("negotiations._get_negotiation_data") as mock_get_data, \
             patch("negotiations._generate_email_content_with_llm") as mock_gen_email, \
             patch("negotiations._save_email_draft") as mock_save:
             
            mock_get_db.return_value = MagicMock()
            mock_get_data.return_value = {"clause_text": "Arbitration", "company_name": "Test Inc"}
            mock_gen_email.return_value = "Mocked Email Body"
            
            request = EmailRequest(negotiation_id="123", tone="polite")
            
            response = await generate_email("123", request)
            
            self.assertEqual(response["email_content"], "Mocked Email Body")
            self.assertEqual(response["negotiation_id"], "123")
            
            # Verify flow
            mock_get_data.assert_called_once()
            mock_gen_email.assert_called_once_with("Arbitration", "Test Inc", "polite")
            mock_save.assert_called_once()
