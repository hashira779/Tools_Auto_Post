# ── SaveMedia API Backend ────────────────────────────────────────
# Multi-stage build: Python + ffmpeg for media processing

FROM python:3.12-slim AS base
ENV DEBIAN_FRONTEND=noninteractive

# Install ffmpeg (required for audio extraction / video merging)
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

# Create downloads directory
RUN mkdir -p /tmp/savemedia_downloads

# Environment
ENV PYTHONUNBUFFERED=1
ENV DOWNLOAD_DIR=/tmp/savemedia_downloads
ENV COOKIES_FILE=""

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

# Run with uvicorn — 2 workers (heavy downloads handled by Celery worker)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
