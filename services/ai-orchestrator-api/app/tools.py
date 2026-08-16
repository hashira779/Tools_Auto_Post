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
    }
}
