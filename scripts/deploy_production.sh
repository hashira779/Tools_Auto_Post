#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
#  CamTech — Zero-Downtime Safe Deploy with Automated Rollback
# ══════════════════════════════════════════════════════════════════

set -euo pipefail

APP_DIR="/home/ubuntu-server/CamTech"
BACKUP_DIR="/home/ubuntu-server/CamTech_backup"
SUDO_PASS="pTT!CT01"

echo "===================================================="
echo "  🚀 Starting Safe Production Deployment"
echo "===================================================="

# 1. Backup current working state if exists
if [ -d "$APP_DIR" ]; then
    echo "📦 Creating backup of current working state..."
    mkdir -p "$BACKUP_DIR"
    rsync -a --delete --exclude '.git' --exclude 'downloads' --exclude 'savemedia-downloads' "$APP_DIR/" "$BACKUP_DIR/"
fi

# 2. Sync new code to APP_DIR
echo "🔄 Syncing new files to $APP_DIR..."
mkdir -p "$APP_DIR"
rsync -a --exclude '.git' --exclude '.venv' ./ "$APP_DIR/"

cd "$APP_DIR"

# 3. Pre-flight system check
echo "📊 System Resource Check:"
echo "--- Memory ---"
free -h
echo "--- Disk Space ---"
df -h /

# 4. Build Docker images first (without stopping running containers)
echo "🔨 Building Docker images..."
if ! echo "$SUDO_PASS" | sudo -S docker compose build; then
    echo "===================================================="
    echo "❌ Build failed! Aborting deployment without affecting running services."
    echo "🔍 Debug Info: System logs (checking for OOM or disk errors)..."
    echo "--- dmesg (last 20 lines) ---"
    echo "$SUDO_PASS" | sudo -S dmesg | tail -n 20 || true
    echo "--- Disk Space ---"
    df -h /
    echo "===================================================="
    
    if [ -d "$BACKUP_DIR" ]; then
        echo "🔄 Restoring previous working code..."
        rsync -a --delete "$BACKUP_DIR/" "$APP_DIR/"
    fi
    exit 1
fi

# 5. Gracefully apply updates
echo "🚀 Starting updated containers..."
echo "$SUDO_PASS" | sudo -S docker compose up -d --remove-orphans

# 5. Smoke tests / Health verification
echo "🔍 Verifying service health..."
MAX_RETRIES=30
RETRY_INTERVAL=2

check_health() {
    local url=$1
    local name=$2
    for i in $(seq 1 $MAX_RETRIES); do
        if curl -f -s -m 3 "$url" > /dev/null 2>&1; then
            echo "   ✅ $name is healthy!"
            return 0
        fi
        echo "   ⏳ Waiting for $name ($i/$MAX_RETRIES)..."
        sleep $RETRY_INTERVAL
    done
    echo "   ❌ $name failed health check at $url"
    return 1
}

DEPLOY_FAILED=0

# Verify Frontend
if ! check_health "http://localhost:80/" "CamTech Frontend"; then
    DEPLOY_FAILED=1
fi

# Verify Media API (routed via Nginx)
if ! check_health "http://localhost:80/api/health" "Media API"; then
    DEPLOY_FAILED=1
fi

# Verify Sticker API (routed via Nginx)
if ! check_health "http://localhost:80/api/sticker/styles" "Sticker API"; then
    DEPLOY_FAILED=1
fi

# 6. Automated Rollback if deployment failed
if [ "$DEPLOY_FAILED" -eq 1 ]; then
    echo "===================================================="
    echo "  ⚠️ DEPLOYMENT FAILED! Initiating Automated Rollback..."
    echo "===================================================="
    
    echo "📋 Container logs (last 50 lines):"
    echo "$SUDO_PASS" | sudo -S docker compose logs --tail=50 || true
    
    if [ -d "$BACKUP_DIR" ]; then
        echo "🔄 Restoring working backup..."
        rsync -a --delete "$BACKUP_DIR/" "$APP_DIR/"
        cd "$APP_DIR"
        echo "$SUDO_PASS" | sudo -S docker compose up -d --build
        echo "✅ Rollback complete. Previous stable version is running."
    fi
    exit 1
fi

echo "===================================================="
echo "  🎉 Deployment Succeeded & Verified! All services UP."
echo "===================================================="
