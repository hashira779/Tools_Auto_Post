FROM python:3.11-slim

# Install ffmpeg, Khmer fonts, SSL certs, and build tools.
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg git fontconfig fonts-noto-core ca-certificates && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better Docker cache
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy project files
COPY . .

# Create downloads directory
RUN mkdir -p /app/downloads

# Make start script executable
RUN chmod +x start.sh

# Run both bots via the script
CMD ["./start.sh"]
