import os
import json
from duckduckgo_search import DDGS
from PyPDF2 import PdfReader
from pydantic import BaseModel, Field

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Tool Schemas (For LLM Function Calling)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class WebSearchSchema(BaseModel):
    query: str = Field(..., description="The exact search query to look up on the web.")
    max_results: int = Field(3, description="Maximum number of search results to return.")

class ReadDocumentSchema(BaseModel):
    filepath: str = Field(..., description="The absolute path to the document file (PDF or TXT) to read.")

class GenerateDocumentSchema(BaseModel):
    title: str = Field(..., description="The title of the document to generate (used for filename).")
    content: str = Field(..., description="The content of the document. Use Markdown formatting for rich text.")
    format: str = Field(..., description="The format of the document to generate. Must be 'txt', 'md', or 'pdf'.")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Tool Implementations
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def web_search(query: str, max_results: int = 3) -> str:
    """Performs a web search using DuckDuckGo."""
    try:
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                results.append(f"Title: {r.get('title')}\nLink: {r.get('href')}\nSnippet: {r.get('body')}")
        
        if not results:
            return "No web search results found."
        return "\n\n".join(results)
    except Exception as e:
        return f"Web search failed: {str(e)}"

def read_document(filepath: str) -> str:
    """Extracts text from a local PDF or TXT file."""
    
    # Security: Prevent Local File Inclusion (LFI) & Directory Traversal
    uploads_dir = os.path.abspath("/app/uploads")
    target_path = os.path.abspath(filepath)
    
    if not target_path.startswith(uploads_dir):
        return f"Security Error: Access to {filepath} is blocked. You can only read files from /app/uploads/"
        
    if not os.path.exists(target_path):
        return f"Error: File not found at path {target_path}"
        
    try:
        ext = filepath.split('.')[-1].lower()
        if ext == 'txt':
            with open(filepath, 'r', encoding='utf-8') as f:
                return f.read()
        elif ext == 'pdf':
            reader = PdfReader(filepath)
            text = []
            for page in reader.pages:
                text.append(page.extract_text() or "")
            return "\n".join(text)
        else:
            return f"Error: Unsupported file extension .{ext}"
    except Exception as e:
        return f"Failed to read document: {str(e)}"

def generate_document(title: str, content: str, format: str) -> str:
    """Generates a document and saves it to the database for downloading."""
    try:
        from .database import SessionLocal
        from .models import GeneratedDocument
        import re
        
        # Clean title for filename
        clean_title = re.sub(r'[^a-zA-Z0-9_\- ]', '', title).strip().replace(' ', '_')
        if not clean_title:
            clean_title = "document"
            
        ext = format.lower()
        if ext not in ['txt', 'md', 'pdf']:
            ext = 'md'
            
        filename = f"{clean_title}.{ext}"
        
        # Prepare binary content
        if ext == 'pdf':
            try:
                from fpdf import FPDF
                pdf = FPDF()
                pdf.add_page()
                pdf.set_auto_page_break(auto=True, margin=15)
                pdf.set_font("Helvetica", size=12)
                # Ensure text is encoded correctly for FPDF
                safe_content = content.encode('latin-1', 'replace').decode('latin-1')
                pdf.multi_cell(0, 10, txt=safe_content)
                file_bytes = pdf.output(dest='S')
                # FPDF2 output(dest='S') returns bytearray
                if not isinstance(file_bytes, bytes):
                    file_bytes = bytes(file_bytes)
                content_type = "application/pdf"
            except ImportError:
                return "Failed to generate PDF: fpdf2 is not installed."
        else:
            file_bytes = content.encode('utf-8')
            content_type = "text/plain" if ext == 'txt' else "text/markdown"
            
        # Save to database
        db = SessionLocal()
        try:
            new_doc = GeneratedDocument(
                filename=filename,
                content_type=content_type,
                content=file_bytes
            )
            db.add(new_doc)
            db.commit()
            db.refresh(new_doc)
            
            download_url = f"https://camtech.cam/api/chat/download/{new_doc.id}"
            return f"Document generated successfully! Provide this download link to the user: {download_url}"
        finally:
            db.close()
            
    except Exception as e:
        return f"Failed to generate document: {str(e)}"

# Registry mapping tool names to functions and schemas
TOOLS_REGISTRY = {
    "web_search": {
        "function": web_search,
        "schema": WebSearchSchema,
        "description": "Searches the web for up-to-date information. Use this when the user asks about current events, facts, or information you do not know."
    },
    "read_document": {
        "function": read_document,
        "schema": ReadDocumentSchema,
        "description": "Reads the content of a local PDF or TXT file. Use this when the user asks you to analyze or extract information from a file they uploaded."
    },
    "generate_document": {
        "function": generate_document,
        "schema": GenerateDocumentSchema,
        "description": "Generates a downloadable document (PDF, TXT, or MD) and saves it for the user. Use this when the user explicitly asks you to generate, write, or export a document. Always provide the returned download link to the user."
    }
}
