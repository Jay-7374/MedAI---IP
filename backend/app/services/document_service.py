import os
import io
import fitz  # PyMuPDF
from docx import Document
from groq import Groq
from app.config import settings

def extract_text_from_file(file_content: bytes, filename: str) -> str:
    """Extracts text from PDF, DOCX, or TXT file bytes."""
    ext = os.path.splitext(filename)[1].lower()
    text = ""
    
    if ext == ".pdf":
        doc = fitz.open(stream=file_content, filetype="pdf")
        for page in doc:
            text += page.get_text()
    elif ext == ".docx":
        doc = Document(io.BytesIO(file_content))
        for para in doc.paragraphs:
            text += para.text + "\n"
    elif ext == ".txt":
        try:
            text = file_content.decode("utf-8")
        except UnicodeDecodeError:
            text = file_content.decode("latin-1", errors="ignore")
    else:
        raise ValueError(f"Unsupported file format: {ext}")
        
    return text.strip()

def summarize_document(text: str, filename: str) -> str:
    """Uses Groq LLM to summarize the extracted document text."""
    if not text:
        return "No extractable text found in this document."
        
    if len(text) > 100000:
        text = text[:100000] # truncate very large documents to avoid token limits
        
    client = Groq(api_key=settings.GROQ_API_KEY)
    
    prompt = f"Please provide a concise and clinically relevant summary of the following document named '{filename}':\n\n{text}"
    
    response = client.chat.completions.create(
        model=settings.TEXT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
        temperature=0.3
    )
    
    return response.choices[0].message.content.strip()
