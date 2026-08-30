# CamTech

Monorepo for CamTech media automation tools.

## Architecture

```
CamTech/
├── docker-compose.yml              ← Main orchestration (Control Plane + UI)
├── docker-compose.ors-worker.yml   ← Worker orchestration (AI Scaling)
├── docker-compose.monitoring.yml   ← Optional Prometheus + Grafana stack
├── .env / .env.example             ← Environment config
│
├── services/
│   ├── ai-orchestrator-api/        ← Central AI Agent & ReAct Logic
│   ├── podcast-api/                ← Khmer → English Localization Engine
│   ├── auto-post-bot/              ← Telegram bot (download → YouTube/TikTok/FB)
│   ├── mms-tts/                    ← Offline Khmer TTS
│   ├── savemedia-web/              ← Web downloader (MP4/MP3) + React SPA
│   ├── sticker-maker/              ← Sticker generation service
│   ├── screen-share-api/           ← WebRTC signaling (Live Camera)
│   └── admin-web/                  ← Admin dashboard
│
├── shared/                         ← Shared Python libraries
├── credentials/                    ← OAuth secrets (gitignored)
├── scripts/                        ← camtech CLI + deploy scripts
└── tests/                          ← Test files
```

## Frontend Routes

The main web app (`services/savemedia-web/frontend`) uses React Router with real URLs:

| Route | Tool |
|-------|------|
| `/` | Media Downloader |
| `/tts` | Text-to-Voice Studio |
| `/sticker` | Telegram Sticker Studio |
| `/pdf-tools` | PDF Tools (Stirling-PDF) |
| `/live` | Live Camera host studio |
| `/share/:roomId` | Live Camera guest view |
| `/admin` | Admin Dashboard (admin users only) |

## Ops CLI

All cluster operations go through a single CLI (credentials via env vars
or `~/.camtech_env` — never hardcoded):

```bash
export CAMTECH_HOST=10.1.0.11 CAMTECH_USER=ubuntu-server CAMTECH_PASS=...
python3 scripts/camtech.py status      # docker ps + disk + memory
python3 scripts/camtech.py logs camtech-savemedia-api
python3 scripts/camtech.py health      # check all /health endpoints
python3 scripts/camtech.py gpu --all   # GPU status incl. ORS workers
python3 scripts/camtech.py deploy      # trigger production deploy
```

## Monitoring

Optional Prometheus + Grafana + cAdvisor + node-exporter stack:

```bash
GRAFANA_ADMIN_PASSWORD=yourpass \
  docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
# Grafana → http://SERVER_IP:3001 (admin / yourpass)
```

## CI

Every PR runs `.github/workflows/ci.yml`:
- Frontend lint (oxlint) + production build
- Python syntax check across all services
- podcast-api pytest suite
- **Secrets guard** — fails the build if cookies.txt, .env files,
  hardcoded JWTs, or password literals are ever committed

## Cluster & Scaling

CamTech is designed for multi-server scaling using an **Nginx-based AI Cluster**.

### 1. Main Server (Control Plane)
Runs the Database, Redis, Nginx, Frontend, and all core APIs.
- **Port 80**: Public gateway.
- **Port 5432**: PostgreSQL (exposed to LAN for workers).
- **Port 6379**: Redis (exposed to LAN for workers).

### 2. ORS Worker Nodes (10.2.7.251, 10.2.7.252)
Offload heavy AI tasks (Whisper, NLLB, Qwen, Ollama).
- Runs `docker-compose.ors-worker.yml`.
- Connects to Main Server for DB and Task Queue.

### 3. Load Balancing
Nginx (in `savemedia-frontend`) automatically load balances across:
- `ai_cluster`: Distributes Agent Orchestrator requests.
- `podcast_cluster`: Distributes Podcast Translation API requests.
- **Health Checks**: Automatic failover if a worker node goes offline.

### 4. Shared Storage (CRITICAL)
For multi-server scaling, the following Docker volumes **MUST** be shared using a network filesystem (NFS, SMB, or GlusterFS):
- `ai-uploads`: Shared between Orchestrator instances.
- `podcast-storage`: Shared between Podcast API and all Podcast Workers.

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
> **Note:** GitHub App tokens cannot push workflow files. To enable CI, run:
> `git mv ci.yml.github-workflow .github/workflows/ci.yml && git commit -m "ci: enable workflow" && git push`
