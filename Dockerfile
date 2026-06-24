FROM python:3.11-slim

# Install ffmpeg, Khmer fonts, SSL certs, and build tools (gcc needed for kfa/ctc-forced-aligner).
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg git fontconfig fonts-noto-core build-essential ca-certificates && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Create downloads directory
RUN mkdir -p /app/downloads

# Make start script executable
RUN chmod +x start.sh

# Run both bots via the script
CMD ["./start.sh"]
