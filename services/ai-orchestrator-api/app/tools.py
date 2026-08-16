import os
import json
from duckduckgo_search import DDGS
from PyPDF2 import PdfReader
from pydantic import BaseModel, Field
from sqlalchemy import text
from .database import engine

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Tool Schemas (For LLM Function Calling)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class WebSearchSchema(BaseModel):
    query: str = Field(..., description="The exact search query to look up on the web.")
    max_results: int = Field(3, description="Maximum number of search results to return.")

class ReadDocumentSchema(BaseModel):
    filepath: str = Field(..., description="The absolute path to the document file (PDF or TXT) to read.")

class QueryDatabaseSchema(BaseModel):
    query: str = Field(..., description="The raw SQL query to execute against the PostgreSQL database.")

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
    if not os.path.exists(filepath):
        return f"Error: File not found at path {filepath}"
        
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

def query_database(query: str) -> str:
    """Executes a read-only SQL query against the database."""
    # Basic security check to prevent destructive operations
    forbidden = ["insert", "update", "delete", "drop", "alter", "truncate", "create", "grant"]
    lower_query = query.lower()
    if any(word in lower_query for word in forbidden):
        return "Error: Security violation. Only read (SELECT) operations are permitted."
        
    try:
        with engine.connect() as conn:
            result = conn.execute(text(query))
            rows = result.fetchall()
            
            if not rows:
                return "Query returned 0 rows."
            
            # Format results as a markdown table
            columns = list(result.keys())
            output = [
                " | ".join(str(c) for c in columns),
                " | ".join("---" for _ in columns)
            ]
            for row in rows:
                output.append(" | ".join(str(v) for v in row))
                
            return "\n".join(output)
    except Exception as e:
        return f"Database error: {str(e)}"

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
    "query_database": {
        "function": query_database,
        "schema": QueryDatabaseSchema,
        "description": "Executes a SELECT SQL query against the CAMTECH application PostgreSQL database. Use this to analyze business data, users, and application state. Return insights based on the query results."
    }
}
