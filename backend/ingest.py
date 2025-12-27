import re
import requests
from bs4 import BeautifulSoup
import PyPDF2
from fastapi import UploadFile, HTTPException

def sanitize_text(text: str) -> str:
    """
    Cleans text for LLM processing.
    Removes excessive whitespace, non-printable characters.
    """
    # Use split/join to avoid potential ReDoS with regex \s+ on very large strings
    # This is safer and cleaner equivalent to re.sub(r'\s+', ' ', text)
    return ' '.join(text.split())

async def extract_text_from_pdf(file: UploadFile, max_pages: int = 50) -> str:
    import traceback
    try:
        print(f"Adding debug log: extracting PDF {file.filename}")
        reader = PyPDF2.PdfReader(file.file)
        
        if len(reader.pages) > max_pages:
             raise HTTPException(status_code=400, detail=f"PDF too large: {len(reader.pages)} pages. Max allowed is {max_pages}.")

        text = ""
        for i, page in enumerate(reader.pages):
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
            print(f"Page {i}: extracted {len(extracted or '')} chars")
            
        print(f"Total PDF extracted chars: {len(text)}")
        return sanitize_text(text)
    except HTTPException:
        raise
    except Exception as e:
        print("ERROR IN PDF EXTRACTION:")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Failed to read PDF: {str(e)}")

def extract_text_from_url(url: str) -> str:
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.decompose()
            
        text = soup.get_text()
        return sanitize_text(text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to scrape URL: {str(e)}")

async def extract_text_from_docx(file: UploadFile) -> str:
    import docx
    import io
    import traceback
    try:
        print(f"Adding debug log: extracting DOCX {file.filename}")
        content = await file.read()
        print(f"Read {len(content)} bytes from {file.filename}")
        doc = docx.Document(io.BytesIO(content))
        text = "\n".join([para.text for para in doc.paragraphs])
        print(f"Extracted {len(text)} chars from DOCX")
        return sanitize_text(text)
    except Exception as e:
        print("ERROR IN DOCX EXTRACTION:")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Failed to read DOCX: {str(e)}")
