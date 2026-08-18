# CamTech Admin Console

A standalone React (Vite) single-page app for administering the CamTech platform.
It is intentionally separate from the public `savemedia-web` frontend and talks to the
existing **AI Orchestrator API** admin endpoints.

## Features

- **Google login** via Supabase OAuth (same Supabase project as the rest of CamTech).
- **Admin-only access** — after login the app calls `GET /api/auth/me`; only users with
  `is_admin = true` can enter. Everyone else sees an "Access Denied" screen.
- **Access token management**
  - Create tokens with a validity date range (`valid_days`) **or** unlimited / never-expiring.
  - Set max uses (or unlimited).
  - **Enable / disable (revoke)** a token at any time without deleting it.
  - Delete tokens permanently.
- **User management** — list users, toggle `verified` / `admin`, and block / unblock.

Regular users still redeem these tokens from the product apps (orchAI chat, etc.) via the
existing `POST /api/admin/verify-token` endpoint and the `get_verified_user` gate.

## Configuration

Copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_API_TARGET=http://localhost:8000   # dev proxy target for /api
```

The first admin is bootstrapped by adding their Google email to `ADMIN_EMAILS`
in the root `.env` (consumed by the AI Orchestrator API).

## Local development

```bash
cd services/admin-web
npm install
npm run dev            # → http://localhost:3100
```

`/api/*` is proxied to `VITE_API_TARGET` (the AI Orchestrator API).

## Docker

Built and served by Nginx (see `Dockerfile` / `nginx.conf`). In `docker-compose.yml`
the service is `admin-web`, published on host port **8080**, and proxies `/api` to the
`ai-orchestrator-api` container. Supabase keys are passed as build args because Vite
inlines them at build time:

```bash
docker compose up --build admin-web
# → http://localhost:8080
```

## Notes on the shared database

All CamTech services (main server + ORS worker nodes) point at the **same** PostgreSQL
database via `DATABASE_URL`. There is a single source of truth for users and tokens, so
an admin action here is immediately visible to every service — nothing else to "sync".
