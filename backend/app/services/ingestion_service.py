import re
import requests
from bs4 import BeautifulSoup
import PyPDF2
from fastapi import UploadFile, HTTPException
from typing import Optional
from app.core.exceptions import IngestionException
from app.core.config import settings
from app.core.logging import logger


def sanitize_text(text: str) -> str:
    """
    Cleans text for LLM processing.
    Removes excessive whitespace, non-printable characters.
    """
    # Use split/join to avoid potential ReDoS with regex \s+ on very large strings
    return ' '.join(text.split())


class IngestionService:
    """Service for extracting text from various document formats."""
    
    def __init__(self):
        self.max_pdf_pages = settings.max_pdf_pages
    
    async def extract_text_from_pdf(self, file: UploadFile) -> str:
        """Extract text from PDF file."""
        try:
            logger.info(f"Extracting text from PDF: {file.filename}")
            reader = PyPDF2.PdfReader(file.file)
            
            if len(reader.pages) > self.max_pdf_pages:
                raise IngestionException(
                    f"PDF too large: {len(reader.pages)} pages. Max allowed is {self.max_pdf_pages}.",
                    status_code=400
                )
            
            text = ""
            for i, page in enumerate(reader.pages):
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
                logger.debug(f"Page {i}: extracted {len(extracted or '')} chars")
            
            logger.info(f"Total PDF extracted chars: {len(text)}")
            return sanitize_text(text)
        except IngestionException:
            raise
        except Exception as e:
            logger.error(f"PDF extraction error: {e}", exc_info=True)
            raise IngestionException(f"Failed to read PDF: {str(e)}")
    
    async def extract_text_from_docx(self, file: UploadFile) -> str:
        """Extract text from DOCX file."""
        import docx
        import io
        
        try:
            logger.info(f"Extracting text from DOCX: {file.filename}")
            content = await file.read()
            logger.debug(f"Read {len(content)} bytes from {file.filename}")
            
            doc = docx.Document(io.BytesIO(content))
            text = "\n".join([para.text for para in doc.paragraphs])
            
            logger.info(f"Extracted {len(text)} chars from DOCX")
            return sanitize_text(text)
        except Exception as e:
            logger.error(f"DOCX extraction error: {e}", exc_info=True)
            raise IngestionException(f"Failed to read DOCX: {str(e)}")
    
    def extract_text_from_url(self, url: str) -> str:
        """Extract text from URL by scraping."""
        try:
            logger.info(f"Extracting text from URL: {url}")
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()
            
            text = soup.get_text()
            logger.info(f"Extracted {len(text)} chars from URL")
            return sanitize_text(text)
        except requests.RequestException as e:
            logger.error(f"URL extraction error: {e}", exc_info=True)
            raise IngestionException(f"Failed to scrape URL: {str(e)}")
        except Exception as e:
            logger.error(f"URL extraction error: {e}", exc_info=True)
            raise IngestionException(f"Failed to process URL: {str(e)}")
    
    async def extract_text_from_file(self, file: UploadFile) -> str:
        """Extract text from uploaded file based on file extension."""
        if not file.filename:
            raise IngestionException("Filename is required")
        
        filename_lower = file.filename.lower()
        
        if filename_lower.endswith(".pdf"):
            return await self.extract_text_from_pdf(file)
        elif filename_lower.endswith(".docx"):
            return await self.extract_text_from_docx(file)
        else:
            raise IngestionException(
                f"Unsupported file type. Only PDF and DOCX are supported.",
                status_code=400
            )
