FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (sndfile is required for soundfile)
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU first to ensure it doesn't pull CUDA
RUN pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cpu

# Install remaining dependencies
COPY requirements.txt .
# Remove the torch line from requirements since we just installed it
RUN grep -v "torch" requirements.txt > req_no_torch.txt && \
    pip install --no-cache-dir -r req_no_torch.txt

COPY . .

# Download the model weights during build to cache them
RUN python -c "from transformers import VitsModel, AutoTokenizer; VitsModel.from_pretrained('facebook/mms-tts-khm'); AutoTokenizer.from_pretrained('facebook/mms-tts-khm')"

EXPOSE 8002

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8002"]
