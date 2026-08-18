# ── CAMTECH Podcast Translator API ──────────────────────────────
# Khmer → Natural English podcast localization service
# CPU-first, modular, resumable, fault-tolerant

FROM python:3.12-slim
ENV DEBIAN_FRONTEND=noninteractive

# ── System Dependencies ─────────────────────────────────────────
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    espeak-ng \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Python Dependencies ─────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Pre-download AI Models ──────────────────────────────────────
# faster-whisper medium model (~1.5 GB)
RUN python -c "from faster_whisper import WhisperModel; WhisperModel('medium', device='cpu', compute_type='int8')" || true

# Piper TTS English voices (pre-download during build)
RUN mkdir -p /app/models/piper && \
    curl -fL -o /app/models/piper/en_US-lessac-medium.onnx \
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx" && \
    curl -fL -o /app/models/piper/en_US-lessac-medium.onnx.json \
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json" && \
    curl -fL -o /app/models/piper/en_GB-alba-medium.onnx \
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alba/medium/en_GB-alba-medium.onnx" && \
    curl -fL -o /app/models/piper/en_GB-alba-medium.onnx.json \
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alba/medium/en_GB-alba-medium.onnx.json"

# ── Pre-warm Caches ─────────────────────────────────────────────
RUN python -c "import librosa; import matplotlib" || true

# ── Copy Application Code ───────────────────────────────────────
COPY app/ ./app/

# ── Environment ─────────────────────────────────────────────────
ENV PYTHONUNBUFFERED=1
ENV PIPER_MODELS_DIR=/app/models/piper

EXPOSE 8003

# ── Health Check ────────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8003/health')" || exit 1

# ── Run ─────────────────────────────────────────────────────────
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8003", "--workers", "2", "--loop", "uvloop", "--http", "httptools"]
