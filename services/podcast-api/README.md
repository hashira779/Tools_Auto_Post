# CAMTECH AI Podcast Translator API

This is the backend service for the Khmer → Natural English Podcast Translator.
It handles audio upload, transcription, translation, verification, and TTS generation.

## Windows CPU Deployment

This module is designed to run efficiently on Windows CPUs without requiring a CUDA-compatible GPU. 

### Prerequisites
1. **Python 3.10+**
2. **FFmpeg**: Must be installed and accessible in your system `PATH`.
   - Download from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/)
   - Extract and add the `bin` folder to your Environment Variables.
3. **Ollama**: For local LLM inference.
   - Download from [ollama.com](https://ollama.com/download/windows)
   - Install and run `ollama run qwen2.5:3b` (or preferred Qwen model).
4. **PostgreSQL**: Must be running (can use Docker or native Windows installation).

### Installation

1. Create a virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```

2. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

### CPU & RAM Tuning (Environment Variables)

Set these environment variables in your `.env` file to optimize performance and prevent RAM exhaustion on standard workstations:

```env
# Limit overall heavy worker concurrency
CPU_THREADS=8

# faster-whisper optimizations
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8
WHISPER_THREADS=6
WHISPER_MODEL=medium

# NLLB Translation optimizations
NLLB_MODEL=facebook/nllb-200-distilled-600M
NLLB_COMPUTE_TYPE=int8

# Ollama / Qwen setup
LLM_PROVIDER=ollama
LLM_MODEL=qwen2.5:3b

# TTS setup
TTS_PROVIDER=piper
```

### Running the Services

You need to run three separate processes for a complete local setup:

**1. Database & Redis (Docker)**
If you are using Docker for infrastructure:
```powershell
docker-compose up -d postgres redis
```

**2. API Server**
```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload
```

**3. Celery Worker (Background Processing)**
Since Windows does not natively support Celery's default `prefork` pool well, you must run it with the `solo` pool or use eventlet/gevent:
```powershell
celery -A app.workers.celery_app worker --pool=solo --loglevel=info -Q podcast
```

## Model Downloads

The system will automatically download models (faster-whisper, NLLB) into your local huggingface cache `~/.cache/huggingface/` on the first run. Please ensure you have at least **10GB** of free disk space.

## Testing

To run the automated test suite:
```powershell
pytest tests/ -v
```
