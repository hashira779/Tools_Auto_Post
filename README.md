# CamTech

Monorepo for CamTech media automation tools.

## Architecture

```
CamTech/
├── docker-compose.yml              ← Unified orchestration
├── .env / .env.example             ← Environment config
│
├── services/
│   ├── auto-post-bot/              ← Telegram bot (download → YouTube/TikTok/FB)
│   │   ├── Dockerfile
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── bot/                    Telegram handlers
│   │   ├── youtube/                YouTube auth + upload
│   │   ├── tiktok/                 TikTok auth + upload
│   │   ├── facebook/               Facebook templates + upload
│   │   └── lyrics_srt/             SRT subtitle generation
│   │
│   └── savemedia-web/              ← Web downloader (MP4/MP3)
│       ├── frontend/               React SPA (Vite + Tailwind v4)
│       │   ├── Dockerfile          Multi-stage: Node → Nginx
│       │   └── src/
│       └── media-api/              FastAPI + yt-dlp microservice
│           ├── Dockerfile
│           └── app/
│
├── shared/                         ← Shared Python libraries
│   ├── downloader/                 yt-dlp engine (used by both services)
│   └── utils/                      Logger, link parser
│
├── credentials/                    ← OAuth secrets (gitignored)
├── scripts/                        ← Deploy & setup scripts
└── tests/                          ← Test files
```

## Services

| Service | Description | Port |
|---------|-------------|------|
| **SaveMedia Web** | Download MP4/MP3 from YouTube, TikTok, Douyin, Instagram, Facebook | `:80` |
| **Auto Post Bot** | Telegram bot for automated content posting | — |

## Quick Start

### Run everything with Docker
```bash
cp .env.example .env    # Configure your tokens
docker compose up --build
```

### Run individual services
```bash
# SaveMedia Web only
docker compose up savemedia-frontend savemedia-api

# Auto Post Bot only
docker compose up auto-post-bot
```

### Local Development

**SaveMedia Web:**
```bash
# Backend
cd services/savemedia-web/media-api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd services/savemedia-web/frontend
npm install && npm run dev    # → http://localhost:3000
```

**Auto Post Bot:**
```bash
cd services/auto-post-bot
pip install -r requirements.txt
# Set PYTHONPATH to include shared/
$env:PYTHONPATH = "../../shared"   # PowerShell
export PYTHONPATH="../../shared"   # Bash
python main.py
```

## Adding a New Service

1. Create `services/<service-name>/` with `Dockerfile` + code
2. Add service block in root `docker-compose.yml`
3. If it has a web frontend, add proxy rule in Nginx config
4. Reuse `shared/` libraries via `PYTHONPATH`

## License

See [LICENSE](LICENSE).