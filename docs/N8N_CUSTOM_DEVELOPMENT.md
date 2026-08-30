# CamTech Custom n8n Development Guide

This document is written specifically for future AI agents and developers working on the `services/n8n-custom` module. It explains the core modifications made to the n8n source code to achieve a fully white-labeled experience with native Google Sign-in.

## 1. Authentication Bypass (Master Password)

By default, n8n requires an email and password to log in. To integrate our own external Google Sign-in flow seamlessly, we implemented a "Master Password Bypass" inside the backend API.

**Modified File:** `packages/cli/src/controllers/auth.controller.ts`

Inside the `resolvePasswordLogin` function, we injected a backdoor that intercepts login requests. If the password provided matches `CamTechAutomations123!`, the backend completely skips the standard bcrypt password hash comparison and instantly grants a valid session token for the requested email address. 

This allows the frontend to verify a user's Google JWT token, and then immediately ask the backend for an n8n session using the master password, creating a completely passwordless experience for the end user.

## 2. Frontend White-labeling (Vue 3)

The standard n8n setup and login screens have been completely removed and replaced.

**Modified Files:**
- `packages/frontend/editor-ui/src/features/core/auth/views/SetupView.vue`
- `packages/frontend/editor-ui/src/features/core/auth/views/SigninView.vue`

These Vue components were stripped of their standard email/password forms. We injected a `google-button-container` div that utilizes Google Identity Services (`vue3-google-signin`). 

When a user clicks the Google button:
1. Google returns a secure JWT token containing the user's email.
2. The Vue component decodes the JWT to extract the email.
3. The component dispatches a login action to the backend using the extracted email and the master password (`CamTechAutomations123!`).
4. The backend issues a session cookie, and the user is routed directly into the main n8n dashboard.

## 3. Docker Compilation (CRITICAL)

Compiling n8n from source is notoriously difficult because of native C++ bindings (`isolated-vm`, `sqlite3`, etc.) that must match the V8 engine of the Node.js version.

**Crucial Constraints:**
- The n8n build environment is strictly pinned to **Node 24+** according to package.json.
- The final Docker image is built using `docker/images/n8n/Dockerfile`, but this Dockerfile **requires** the Javascript source code to be pre-compiled into a `./compiled` directory beforehand.

**The Official Build Sequence:**
To build the custom image (`camtech-n8n-custom`), you must use an isolated Node 24 environment to pre-compile the Typescript, and then run `docker build`. You must skip C++ script compilation during the Typescript build phase to avoid Node-GYP header mismatches:

```bash
# 1. Pre-compile Typescript using isolated node:24
docker run --rm -v $(pwd)/services/n8n-custom:/app -w /app node:24 /bin/bash -c "npm install -g pnpm@11.22.0 && pnpm install --ignore-scripts && pnpm build:docker"

# 2. Build the final Alpine-based image
docker build -t camtech-n8n-custom -f docker/images/n8n/Dockerfile .
```

## 4. Production Deployment

In production (`10.1.0.11`), the application is managed via `docker-compose.yml` and deployed via `scripts/deploy_production.sh`.

We have modified `docker-compose.yml` to automatically build the custom n8n image if any source files change:
```yaml
  n8n:
    build:
      context: ./services/n8n-custom
      dockerfile: docker/images/n8n/Dockerfile
    image: camtech-n8n-custom
```
*Note for AI Agents:* If you ever need to deploy n8n code changes to the Ubuntu server manually, do **not** just upload the raw Typescript files. You must run the pre-compilation step (Step 3) on the server, or the Docker build will fail with a `"/compiled": not found` error.
