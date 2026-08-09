import os
import io
import time
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from gpu import get_gpu_info

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[
        logging.FileHandler("service.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("voxcpm2-local")

# Define API
app = FastAPI(title="VoxCPM2-Khmer Local Engine")

# Security: CORS locked strictly to CamTech
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://camtech.cam", "https://www.camtech.cam", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

from fastapi.responses import Response, FileResponse

# Serve GUI dashboard
@app.get("/")
@app.get("/app")
async def serve_dashboard():
    gui_path = os.path.join(os.path.dirname(__file__), "..", "gui", "gui.html")
    if os.path.exists(gui_path):
        return FileResponse(gui_path)
    return Response("VoxCPM2-Khmer Local GPU Engine is Running on 127.0.0.1:8765", media_type="text/plain")
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
            # TODO: Add actual VoxCPM2 loading logic here when model files are present.
            # Example:
            # import torch
            # self.model = VoxCPM2.from_pretrained("path/to/models/VoxCPM2-Khmer")
            # self.model.to("cuda")
            
            # Simulated load delay
            time.sleep(2.0)
            
            self.is_loaded = True
            logger.info("VoxCPM2-Khmer loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load VoxCPM2-Khmer: {e}")
        finally:
            self.is_loading = False

    def generate(self, text: str) -> bytes:
        """Generates WAV audio using the loaded model."""
        if not self.is_loaded:
            raise RuntimeError("Model is not loaded.")
            
        logger.info(f"Generating audio for text length: {len(text)}")
        
        # TODO: Replace with actual inference code
        # audio_tensor = self.model.generate(text)
        # return serialize_to_wav(audio_tensor)
        
        # Simulated generation (generates a valid empty/silent WAV file structure for prototype validation)
        import wave
        import struct
        buf = io.BytesIO()
        with wave.open(buf, 'wb') as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(24000)
            # Write 0.5s of silence
            data = [0] * int(24000 * 0.5)
            wav.writeframes(struct.pack('<' + 'h'*len(data), *data))
            
        return buf.getvalue()

# Instantiate global manager
manager = ModelManager()

@app.on_event("startup")
async def startup_event():
    logger.info("VoxCPM2-Khmer Local Engine starting up on 127.0.0.1:8765")
    # Trigger background model load so it's instantly ready for the first request
    import threading
    threading.Thread(target=manager.load_model).start()

class GenerateRequest(BaseModel):
    text: str
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
        "ready": manager.is_loaded
    }

@app.post("/v1/audio/speech")
async def generate_speech(req: GenerateRequest, request: Request):
    """Generates audio. Returns WAV bytes."""
    
    # Simple Request limits
    if len(req.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Empty text provided.")
    if len(req.text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long. Max 5000 chars.")
        
    if not manager.is_loaded:
        raise HTTPException(status_code=503, detail="Model is still initializing in the background. Please try again in a few seconds.")

    try:
        wav_bytes = manager.generate(req.text)
        return Response(
            content=wav_bytes,
            media_type="audio/wav"
        )
    except Exception as e:
        logger.error(f"Inference failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Security: Bind strictly to 127.0.0.1
    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="info")
