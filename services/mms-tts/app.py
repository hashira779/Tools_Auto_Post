import io
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
import scipy.io.wavfile as wavfile
from transformers import VitsModel, AutoTokenizer
import numpy as np
from fastapi.responses import Response

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mms-tts")

app = FastAPI(title="MMS-TTS Microservice")

# Global variables for model
model = None
tokenizer = None

@app.on_event("startup")
async def startup_event():
    global model, tokenizer
    logger.info("Loading MMS-TTS model for Khmer...")
    model = VitsModel.from_pretrained("facebook/mms-tts-khm")
    tokenizer = AutoTokenizer.from_pretrained("facebook/mms-tts-khm")
    logger.info("Model loaded successfully!")

class TTSRequest(BaseModel):
    model: str = "mms"
    input: str
    voice: str = "mms-khm"
    response_format: str = "wav"
    speed: float = 1.0

@app.get("/health")
async def health_check():
    return {"status": "ok", "model": "loaded" if model is not None else "loading"}

@app.post("/v1/audio/speech")
async def generate_speech(req: TTSRequest):
    if not req.input or not req.input.strip():
        raise HTTPException(status_code=400, detail="Input text cannot be empty")
        
    try:
        inputs = tokenizer(req.input, return_tensors="pt")
        
        with torch.no_grad():
            output = model(**inputs).waveform
            
        audio_data = output.cpu().numpy().squeeze()
        
        # Apply speed adjustment if needed (basic resample or just modify sample rate)
        # For simplicity without heavy DSP, we can trick the sample rate
        sample_rate = model.config.sampling_rate
        if req.speed != 1.0:
            sample_rate = int(sample_rate * req.speed)
            
        # Convert to WAV bytes in memory
        wav_io = io.BytesIO()
        wavfile.write(wav_io, sample_rate, audio_data)
        wav_io.seek(0)
        
        return Response(
            content=wav_io.read(), 
            media_type="audio/wav",
            headers={"Content-Disposition": f'attachment; filename="mms_voice.wav"'}
        )
        
    except Exception as e:
        logger.error(f"Failed to generate speech: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
