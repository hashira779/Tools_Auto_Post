import os
import io
import sys
import time
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, HTMLResponse, FileResponse
from pydantic import BaseModel

# Resolve paths correctly whether running from source or PyInstaller bundle
if getattr(sys, 'frozen', False):
    _BASE_DIR = sys._MEIPASS
else:
    _BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Ensure 'app' subpackage is importable
sys.path.insert(0, os.path.join(_BASE_DIR, "app"))

from gpu import get_gpu_info

# Configure logging — must handle PyInstaller --windowed mode where sys.stderr is None
_log_handlers = []
if sys.stderr is not None:
    _log_handlers.append(logging.StreamHandler())
else:
    # Windowed mode: log to a file in temp directory
    _log_file = os.path.join(os.environ.get("TEMP", os.path.expanduser("~")), "voxcpm2_engine.log")
    _log_handlers.append(logging.FileHandler(_log_file, encoding="utf-8"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=_log_handlers
)
logger = logging.getLogger("voxcpm2-local")

# Define API
app = FastAPI(title="VoxCPM2-Khmer Local Engine")

from starlette.datastructures import MutableHeaders

class PrivateNetworkMiddleware:
    """Injects Access-Control-Allow-Private-Network: true to bypass browser PNA blocks for localhost."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                headers.append("Access-Control-Allow-Private-Network", "true")
            await send(message)

        await self.app(scope, receive, send_wrapper)

# Security: CORS locked strictly to CamTech & local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://camtech.cam",
        "https://www.camtech.cam",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8765",
        "http://localhost:8765"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Outermost middleware (added last = executed first) to modify all responses including CORS preflights
app.add_middleware(PrivateNetworkMiddleware)


# ── Serve GUI dashboard ──────────────────────────────────────────

@app.get("/")
@app.get("/app")
async def serve_dashboard():
    # Try multiple paths for gui.html
    candidates = [
        os.path.join(_BASE_DIR, "gui", "gui.html"),
        os.path.join(os.path.dirname(__file__), "..", "gui", "gui.html"),
        os.path.join(os.path.dirname(__file__), "gui", "gui.html"),
    ]
    for path in candidates:
        resolved = os.path.normpath(path)
        if os.path.exists(resolved):
            return FileResponse(resolved, media_type="text/html")
    
    # Fallback: inline minimal status page
    return HTMLResponse("""
    <!DOCTYPE html>
    <html><head><title>VoxCPM2-Khmer</title>
    <style>body{background:#08090d;color:#e2e8f0;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
    .c{text-align:center}.s{color:#10b981;font-size:2rem;margin-bottom:1rem}</style></head>
    <body><div class="c"><div class="s">✓</div><h1>VoxCPM2-Khmer Engine Running</h1>
    <p style="color:#94a3b8">Listening on 127.0.0.1:8765</p></div></body></html>
    """)


# System Console Log Stream for Desktop App UI
recent_logs = [
    {"time": time.strftime("%H:%M:%S"), "msg": "[System] VoxCPM2-Khmer Desktop Application initialized.", "level": "system"},
    {"time": time.strftime("%H:%M:%S"), "msg": "[Engine] Starting up on 127.0.0.1:8765...", "level": "ok"}
]

def add_app_log(msg: str, level: str = "info"):
    now = time.strftime("%H:%M:%S")
    recent_logs.append({"time": now, "msg": msg, "level": level})
    if len(recent_logs) > 50:
        recent_logs.pop(0)
    logger.info(f"[CONSOLE] {msg}")


# ── Algorithmic Khmer Number & Text Normalizer ─────────────────────

KHMER_DIGITS_MAP = {'០':'0', '១':'1', '២':'2', '៣':'3', '៤':'4', '៥':'5', '៦':'6', '៧':'7', '៨':'8', '៩':'9'}

def khmer_num_to_words(n: int) -> str:
    """Algorithmic conversion of any integer (0 to millions) to spoken Khmer words."""
    units = ['', 'មួយ', 'ពីរ', 'បី', 'បួន', 'ប្រាំ', 'ប្រាំមួយ', 'ប្រាំពីរ', 'ប្រាំបី', 'ប្រាំបួន']
    tens = ['', 'ដប់', 'ម្ភៃ', 'សាមសិប', 'សែសិប', 'ហាសិប', 'ហុកសិប', 'ចិត្តសិប', 'ប៉ែតសិប', 'កៅសិប']
    if n == 0:
        return 'សូន្យ'
    res = ''
    if n >= 1000000:
        res += khmer_num_to_words(n // 1000000) + 'លាន'
        n %= 1000000
    if n >= 100000:
        res += units[n // 100000] + 'សែន'
        n %= 100000
    if n >= 10000:
        res += units[n // 10000] + 'ម៉ឺន'
        n %= 10000
    if n >= 1000:
        res += units[n // 1000] + 'ពាន់'
        n %= 1000
    if n >= 100:
        res += units[n // 100] + 'រយ'
        n %= 100
    if n >= 10:
        res += tens[n // 10]
        n %= 10
    if n > 0:
        res += units[n]
    return res

def normalize_khmer_text(text: str) -> str:
    """Algorithmic normalizer: converts any Khmer/ASCII numbers to spoken words without any static dictionary."""
    if not text:
        return text
        
    # Convert Khmer digits (០-៩) to ASCII digits
    for k, v in KHMER_DIGITS_MAP.items():
        text = text.replace(k, v)
        
    # Algorithmic conversion of any number sequence to Khmer words
    import re
    def replace_num(match):
        try:
            val = int(match.group(0))
            return " " + khmer_num_to_words(val) + " "
        except Exception:
            return match.group(0)

    text = re.sub(r'\d+', replace_num, text)
    return text.strip()


# ── AI Model Manager ─────────────────────────────────────────────

class ModelManager:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.is_loaded = False
        self.is_loading = False

    def load_model(self):
        """Loads VoxCPM2-Khmer once into VRAM and keeps it ready."""
        if self.is_loaded or self.is_loading:
            return

        self.is_loading = True
        logger.info("Initializing VoxCPM2-Khmer into GPU VRAM...")
        try:
            import torch
            from transformers import VitsModel, AutoTokenizer
            
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Using device: {self.device}")
            
            self.tokenizer = AutoTokenizer.from_pretrained("facebook/mms-tts-khm")
            self.model = VitsModel.from_pretrained("facebook/mms-tts-khm").to(self.device)
            self.is_loaded = True
            add_app_log("VoxCPM2-Khmer AI model loaded successfully into memory.", "ok")
        except ImportError:
            logger.warning("Torch/Transformers not installed. Mocking successful model load for UI testing...")
            time.sleep(2)
            self.is_loaded = True
            add_app_log("Mock VoxCPM2-Khmer engine loaded.", "warn")
        except Exception as e:
            add_app_log(f"Failed to load AI model: {e}", "warn")
            logger.error(f"Failed to load VoxCPM2-Khmer: {e}", exc_info=True)
        finally:
            self.is_loading = False

    def generate(self, text: str, voice: str = "voxcpm2") -> bytes:
        """Generates crisp 16-bit PCM WAV audio using the loaded model."""
        if not self.is_loaded:
            raise RuntimeError("Model is not loaded.")
            
        clean_text = normalize_khmer_text(text)
        logger.info(f"Generating audio for normalized text length: {len(clean_text)} (original: {len(text)}) with voice: {voice}")
        
        # High clarity native neural voice fallback if requested
        if voice in ["piseth", "sreymom", "neural_khmer"]:
            voice_name = "km-KH-SreymomNeural" if voice == "sreymom" else "km-KH-PisethNeural"
            import subprocess, tempfile, os
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
                temp_path = f.name
            try:
                subprocess.run([
                    "C:\\Python314\\python.exe", "-m", "edge_tts",
                    "--voice", voice_name,
                    "--text", clean_text,
                    "--write-media", temp_path
                ], check=True, capture_output=True)
                with open(temp_path, "rb") as f:
                    return f.read()
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)

        try:
            import torch
            import scipy.io.wavfile as wavfile
            import io
            import numpy as np
            
            inputs = self.tokenizer(clean_text, return_tensors="pt").to(self.device)
            with torch.no_grad():
                output = self.model(**inputs).waveform
                
            audio_data = output.cpu().numpy().squeeze()
            sample_rate = self.model.config.sampling_rate
            
            # Normalize float32 audio (-1.0 to 1.0) to 16-bit PCM integer WAV (prevents distortion & metallic noise)
            max_val = np.max(np.abs(audio_data))
            if max_val > 0:
                audio_data = (audio_data / max_val * 32767.0).astype(np.int16)
            else:
                audio_data = audio_data.astype(np.int16)
            
            wav_io = io.BytesIO()
            wavfile.write(wav_io, sample_rate, audio_data)
            wav_io.seek(0)
                
            return wav_io.read()
        except ImportError:
            logger.info("Torch not installed. Returning edge-tts Khmer speech.")
            import subprocess, tempfile, os
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
                temp_path = f.name
            try:
                subprocess.run([
                    "C:\\Python314\\python.exe", "-m", "edge_tts", 
                    "--voice", "km-KH-PisethNeural", 
                    "--text", clean_text, 
                    "--write-media", temp_path
                ], check=True, capture_output=True)
                with open(temp_path, "rb") as f:
                    return f.read()
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)


# Instantiate global manager
manager = ModelManager()


@app.on_event("startup")
async def startup_event():
    logger.info("VoxCPM2-Khmer Local Engine starting up on 127.0.0.1:8765")
    get_gpu_info()
    import threading
    threading.Thread(target=manager.load_model).start()


class GenerateRequest(BaseModel):
    text: str
    voice: Optional[str] = "voxcpm2"
    format: str = "wav"


@app.get("/health")
async def health_check():
    """Website pings this to see if Local Engine is available."""
    gpu = get_gpu_info()
    return {
        "status": "ready" if manager.is_loaded else "starting",
        "service": "voxcpm2-khmer",
        "model": "VoxCPM2-Khmer",
        "version": "1.0.0",
        "gpu": gpu["available"],
        "gpu_name": gpu["name"],
        "ready": manager.is_loaded,
        "logs": recent_logs
    }


@app.post("/v1/audio/speech")
async def generate_speech(req: GenerateRequest, request: Request):
    """Generates audio. Returns WAV/MP3 bytes."""
    if len(req.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Empty text provided.")
    if len(req.text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long. Max 5000 chars.")
        
    if not manager.is_loaded:
        raise HTTPException(status_code=503, detail="Model is still initializing in the background. Please try again in a few seconds.")

    client_host = request.client.host if request.client else "Localhost"
    add_app_log(f"⚡ Request from Web Bridge ({client_host}) — {len(req.text)} chars", "ok")

    t0 = time.time()
    try:
        audio_bytes = manager.generate(req.text, voice=req.voice)
        elapsed = time.time() - t0
        add_app_log(f"✓ Generated audio successfully in {elapsed:.2f}s", "ok")
        
        media_type = "audio/wav" if audio_bytes.startswith(b"RIFF") else "audio/mpeg"
        return Response(
            content=audio_bytes,
            media_type=media_type
        )
    except Exception as e:
        add_app_log(f"✖ Generation failed: {e}", "warn")
        logger.error(f"Inference failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="info")

