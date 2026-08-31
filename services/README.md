# Services

Every deployable unit of CamTech lives in its own folder here. This file is the
catalog and the convention — read it before adding a new service so the repo stays
consistent and the next feature is easy to slot in.

## Catalog

| Folder | What it is | Language | Exposed |
|--------|------------|----------|---------|
| `savemedia-web/` | Main web app: React SPA (`frontend/`) + media download API (`media-api/`). Hosts the whole UI (downloader, TTS, stickers, PDF, live camera, admin) and the Nginx gateway. | React + Python (FastAPI) | `:80` (public gateway) |
| `ai-orchestrator-api/` | Central AI agent / ReAct orchestration. Load-balanced across ORS workers. | Python (FastAPI) | internal |
| `podcast-api/` | Khmer → English localization / podcast translation engine. | Python | internal |
| `auto-post-bot/` | Telegram bot: download → publish to YouTube/TikTok/Facebook. | Python | — (long-poll) |
| `mms-tts/` | Offline Khmer text-to-speech. | Python | internal |
| `sticker-maker/` | Telegram sticker generation. | Python | internal |
| `screen-share-api/` | WebRTC signaling server for iPhone screen sharing / live camera. | Node | `:4000` |
| `admin-web/` | Standalone admin surface (the primary admin UI now lives in `savemedia-web/frontend` at `/admin`). | — | internal |
| `n8n-patches/` | The **only** n8n customization: `patched_auth.controller.js` (Google sign-in bypass) and `patched_index.html` (white-label + sign-in UI), bind-mounted read-only over `n8nio/n8n:latest` in `docker-compose.yml`. | JS / HTML | via `/n8n/` |
| `n8n-custom/` | Full upstream n8n clone, **reference only** — gitignored, not built. Don't wire anything to it. | — | — |

## Standard service layout

```
services/<name>/
├── Dockerfile            ← how it builds/runs
├── .env.example          ← every env var it needs, with placeholder values
├── README.md             ← one paragraph: what it does + how to run locally
├── requirements.txt      ← (Python)  or  package.json (Node)
└── app/ | src/           ← source
```

Rules of thumb:
- **No secrets in the image or compose.** Read them from the environment; document
  each one in the service's `.env.example` and wire real values through the root `.env`.
  Use `${VAR:?message}` in compose so a missing secret fails fast.
- **Reuse `shared/`** for common Python code via `PYTHONPATH` rather than copy-pasting.
- **Talk over the `camtech-net` Docker network** by service name, not host IPs.
- Only publish a host port (`ports:`) when the service must be reachable from outside
  the Docker network. Otherwise use `expose:` — keeps the attack surface small.

## Adding a new service — checklist

1. `mkdir services/<name>/` and add the files from the layout above.
2. Fill `.env.example` with every variable the service reads.
3. Add a service block to the root `docker-compose.yml`:

   ```yaml
   <name>:
     build: ./services/<name>
     container_name: camtech-<name>
     restart: unless-stopped
     environment:
       - SOME_SECRET=${SOME_SECRET:?SOME_SECRET must be set in .env}
     networks:
       - camtech-net
     # expose: ["8000"]         # internal only
     # ports: ["8000:8000"]     # only if it must be reached from the host
   ```

4. If it serves a web UI or API to users, add a proxy `location` block in
   `services/savemedia-web/frontend/nginx.conf` (the gateway) instead of exposing
   a new public port.
5. Add its health endpoint to the smoke tests in `scripts/deploy_production.sh`.
6. Add a row to the **Catalog** table above and to the tree in the root `README.md`.
7. Add the new env vars to the root `.env.example`.
