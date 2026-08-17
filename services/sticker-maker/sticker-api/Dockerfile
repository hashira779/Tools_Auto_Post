# ── Sticker Maker API ────────────────────────────────────────────
# Lightweight Python image processor + Telegram Bot API client

FROM python:3.12-slim
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies (OpenCV requires libglib2.0-0 and libgl1)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    fonts-noto-core curl libglib2.0-0 libgl1 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

# Pre-download the rembg model to prevent 60-second freezes on first sticker creation
ENV U2NET_HOME=/root/.u2net
RUN mkdir -p /root/.u2net && \
    curl -fL -o /root/.u2net/u2net.onnx https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx

# Environment
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8001/api/health')" || exit 1

# Run with uvicorn — 2 workers to save RAM (was 4, used 2.8GB / 36% of server)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2", "--loop", "uvloop", "--http", "httptools"]
