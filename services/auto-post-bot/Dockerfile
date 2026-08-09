# ── Auto Post Bot ────────────────────────────────────────────────
# Build context: CamTech root (to access shared/)

FROM python:3.12-slim
ENV DEBIAN_FRONTEND=noninteractive

# Install ffmpeg, Khmer fonts, SSL certs
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg git fontconfig fonts-noto-core ca-certificates && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY services/auto-post-bot/requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy shared libraries
COPY shared/ /app/shared/

# Copy service code
COPY services/auto-post-bot/ /app/

# Add shared libs to Python path
ENV PYTHONPATH="/app/shared:${PYTHONPATH}"
ENV PYTHONUNBUFFERED=1

# Create runtime directories
RUN mkdir -p /app/downloads /app/credentials

CMD ["python", "main.py"]
