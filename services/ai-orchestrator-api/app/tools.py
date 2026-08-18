import os
import json
import requests
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

class SearchDocumentSchema(BaseModel):
    query: str = Field(..., description="The search query to look up inside the uploaded document.")
    conversation_id: str = Field(..., description="The ID of the current conversation to search within.")
    filename: str = Field(None, description="Optional. The specific filename to search within.")

class GenerateDocumentSchema(BaseModel):
    title: str = Field(..., description="The title of the document to generate (used for filename).")
    content: str = Field(..., description="The content of the document. Use Markdown formatting for rich text.")
    format: str = Field(..., description="The format of the document to generate. Must be 'txt', 'md', or 'pdf'.")

class TranslatePodcastSchema(BaseModel):
    audio_url: str = Field(..., description="The direct URL to the audio file (MP3, WAV, M4A, FLAC) to translate.")
    title: str = Field(..., description="A descriptive title for the podcast translation job.")
    voice_id: str = Field("en_US-lessac-medium", description="The ID of the English voice to use for dubbing.")

class GenerateKhmerVoiceSchema(BaseModel):
    text: str = Field(..., description="The Khmer text to convert to speech.")
    speed: float = Field(1.0, description="The speaking speed (0.5 to 2.0).")

class GetSystemStatusSchema(BaseModel):
    pass

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
    
    try:
        common = os.path.commonpath([uploads_dir, target_path])
        if common != uploads_dir:
            return f"Security Error: Access to {filepath} is blocked. You can only read files from /app/uploads/"
    except ValueError:
        return f"Security Error: Access to {filepath} is blocked."
        
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

def search_document(query: str, conversation_id: str, filename: str = None) -> str:
    """Searches the vector database for relevant chunks of an uploaded document."""
    try:
        from langchain_community.embeddings import OllamaEmbeddings
        from langchain_community.vectorstores import PGVector
        from .database import DATABASE_URL
        import os
        
        OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
        embeddings = OllamaEmbeddings(
            base_url=OLLAMA_URL,
            model="nomic-embed-text"
        )
        
        store = PGVector(
            collection_name=f"conv_{conversation_id}",
            connection_string=DATABASE_URL,
            embedding_function=embeddings,
        )
        
        filter_kwargs = {}
        if filename:
            filter_kwargs["source"] = filename
            
        docs = store.similarity_search(query, k=5, filter=filter_kwargs)
        
        if not docs:
            return "No relevant information found in the uploaded documents."
            
        results = []
        for i, doc in enumerate(docs):
            source = doc.metadata.get("source", "Unknown file")
            results.append(f"--- Chunk {i+1} from {source} ---\n{doc.page_content}")
            
        return "\n\n".join(results)
    except Exception as e:
        return f"Failed to search document: {str(e)}"

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

def translate_podcast(audio_url: str, title: str, voice_id: str = "en_US-lessac-medium") -> str:
    """Triggers the Podcast Translator service to localize a Khmer audio file into English."""
    PODCAST_API_URL = os.environ.get("PODCAST_API_URL", "http://podcast-api:8003")
    
    try:
        # Since the podcast-api /upload endpoint expects a file, we might need a workaround 
        # or the AI could just provide instructions.
        # For now, let's assume we have an endpoint that can fetch from URL if we were to add it.
        # OR, we download it here and then upload it.
        
        # 1. Download the file temporarily
        temp_path = os.path.join("/app/uploads", f"temp_{os.path.basename(audio_url)}")
        resp = requests.get(audio_url, stream=True, timeout=120)
        resp.raise_for_status()
        with open(temp_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
        
        # 2. Upload to podcast-api
        with open(temp_path, "rb") as f:
            files = {"file": (os.path.basename(audio_url), f)}
            data = {
                "title": title,
                "voice_id": voice_id,
                "strict_verification": "false"
            }
            post_resp = requests.post(f"{PODCAST_API_URL}/api/podcast/upload", files=files, data=data, timeout=30)
            post_resp.raise_for_status()
            result = post_resp.json()
            
        # 3. Cleanup temp file
        os.remove(temp_path)
        
        job_id = result.get("job_id")
        return f"Podcast translation job started successfully! Job ID: {job_id}. You can check the progress at: https://camtech.cam/tools/khmer-podcast-translator?job_id={job_id}"
        
    except Exception as e:
        return f"Failed to start podcast translation: {str(e)}"

def generate_khmer_voice(text: str, speed: float = 1.0) -> str:
    """Generates Khmer speech from text using the MMS-TTS engine."""
    MMS_TTS_URL = os.environ.get("MMS_TTS_URL", "http://mms-tts:8002")
    
    try:
        req_data = {
            "input": text,
            "speed": speed,
            "voice": "mms-khm",
            "response_format": "wav"
        }
        resp = requests.post(f"{MMS_TTS_URL}/v1/audio/speech", json=req_data, timeout=30)
        resp.raise_for_status()
        
        # Save to GeneratedDocument
        from .database import SessionLocal
        from .models import GeneratedDocument
        
        db = SessionLocal()
        try:
            new_doc = GeneratedDocument(
                filename="khmer_speech.wav",
                content_type="audio/wav",
                content=resp.content
            )
            db.add(new_doc)
            db.commit()
            db.refresh(new_doc)
            
            download_url = f"https://camtech.cam/api/chat/download/{new_doc.id}"
            return f"Khmer speech generated successfully! Download link: {download_url}"
        finally:
            db.close()
            
    except Exception as e:
        return f"Failed to generate Khmer speech: {str(e)}"

def get_system_status() -> str:
    """Returns the health status of all CamTech microservices."""
    services = {
        "AI Orchestrator": "http://ai-orchestrator-api:8000/health",
        "Podcast API": "http://podcast-api:8003/api/podcast/health",
        "Media API": "http://savemedia-api:8000/api/health",
        "Sticker API": "http://sticker-api:8001/api/sticker/health",
        "MMS TTS": "http://mms-tts:8002/health",
        "Ollama": "http://ollama:11434/api/tags"
    }
    
    results = []
    for name, url in services.items():
        try:
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                results.append(f"✅ {name}: Online")
            else:
                results.append(f"⚠️ {name}: Issue (Status {resp.status_code})")
        except Exception:
            results.append(f"❌ {name}: Offline")
            
    return "\n".join(results)

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
    },
    "search_document": {
        "function": search_document,
        "schema": SearchDocumentSchema,
        "description": "Searches the uploaded documents for specific information using semantic vector search. Use this when the user asks questions about a file they uploaded. It returns relevant text chunks."
    },
    "translate_podcast": {
        "function": translate_podcast,
        "schema": TranslatePodcastSchema,
        "description": "Triggers the translation of a Khmer podcast audio file into English. You must provide a direct URL to the audio file."
    },
    "generate_khmer_voice": {
        "function": generate_khmer_voice,
        "schema": GenerateKhmerVoiceSchema,
        "description": "Converts Khmer text to speech using a local AI model. Returns a download link for the audio file."
    },
    "get_system_status": {
        "function": get_system_status,
        "schema": GetSystemStatusSchema,
        "description": "Checks the status of all CamTech services. Use this if the user complains about things not working or asks if the system is healthy."
    }
}
