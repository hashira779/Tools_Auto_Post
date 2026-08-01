# SaveMedia — Video & Audio Downloader

Microservice-based web app to download **MP4 video** and **MP3 audio** from YouTube, TikTok, Douyin, Instagram, and Facebook.

## Architecture

```
web_downloader/
├── docker-compose.yml           # Orchestrates all services
├── .env.example                 # Environment config template
│
├── frontend/                    # React SPA (Vite + TailwindCSS v4)
│   ├── Dockerfile               # Multi-stage: Node build → Nginx serve
│   ├── nginx.conf               # Reverse proxy to backend services
│   └── src/
│       ├── api/                 # API client layer
│       ├── components/          # UI components
│       ├── constants/           # Platform config, icons
│       ├── hooks/               # Business logic hooks
│       ├── App.jsx              # Root component (composition only)
│       └── index.css            # TailwindCSS + custom theme
│
└── services/                    # ← All microservices live here
    └── media-api/               # Video/audio download service
        ├── Dockerfile
        └── app/
            ├── main.py          # FastAPI app factory
            ├── models/          # Pydantic schemas
            ├── routes/          # HTTP endpoint handlers
            └── services/        # Core business logic
```

## Quick Start

### With Docker (Production)

```bash
cd web_downloader
cp .env.example .env
docker compose up --build
```

App available at `http://localhost:80`

### Local Development

**Backend:**
```bash
cd services/media-api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Frontend at `http://localhost:3000` (proxies API to `:8000`)

## Adding a New Microservice

1. Create `services/<service-name>/` with `Dockerfile` + `app/`
2. Add service block in `docker-compose.yml`
3. Add `location` block in `frontend/nginx.conf`
4. Add API client in `frontend/src/api/`

## API Endpoints

### Media API (`/api`)

| Method | Endpoint        | Description                        |
|--------|----------------|------------------------------------|
| POST   | `/api/fetch`    | Extract video info & formats       |
| POST   | `/api/download` | Download video/audio file          |
| GET    | `/api/health`   | Health check for Docker            |
