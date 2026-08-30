#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
#  CamTech — Zero-Downtime Safe Deploy with Automated Rollback
# ══════════════════════════════════════════════════════════════════

set -euo pipefail

APP_DIR="/home/ubuntu-server/CamTech"
BACKUP_DIR="/home/ubuntu-server/CamTech_backup"
# SUDO_PASS must be provided via environment (set in the self-hosted runner env or ~/.camtech_env)
SUDO_PASS="${CAMTECH_SUDO_PASS:?❌ CAMTECH_SUDO_PASS env var is required}"

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
rsync -a --delete --exclude '.git' --exclude '.venv' --exclude 'node_modules' --exclude '.env' --exclude 'savemedia-downloads' ./ "$APP_DIR/"

cd "$APP_DIR"
chmod +x scripts/*.sh scripts/*.py || true

# 3. Pre-flight system check
echo "📊 System Resource Check:"
echo "--- Memory ---"
free -h
echo "--- Disk Space ---"
df -h /

# 4. Configure Firewall for Coturn TURN Server
echo "🔓 Opening Firewall Ports for Coturn TURN Server..."
echo "$SUDO_PASS" | sudo -S ufw allow 3478/tcp || true
echo "$SUDO_PASS" | sudo -S ufw allow 3478/udp || true
echo "$SUDO_PASS" | sudo -S ufw allow 50000:50100/udp || true
echo "$SUDO_PASS" | sudo -S ufw reload || true

# 5. Build Docker images first (without stopping running containers)
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

# Force Nginx to re-resolve upstream container IPs to fix 502 Bad Gateway
echo "🔄 Reloading Nginx to clear DNS cache..."
echo "$SUDO_PASS" | sudo -S docker compose exec -T savemedia-frontend nginx -s reload || true

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

# Verify Screen Share API (Signaling Server on port 4000)
if ! check_health "http://localhost:4000/health" "Screen Share API"; then
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
echo "  🎉 Deployment Succeeded & Verified! Main Server UP."
echo "===================================================="

# 7. Deploy to ORS Workers (Optional)
# If you have ORS workers, this will automatically deploy to them.
echo "===================================================="
echo "  🚀 Deploying to ORS Workers"
echo "===================================================="

ORS_PASS="${CAMTECH_ORS_PASS:-$CAMTECH_SUDO_PASS}"

# Workers defined as "IP|USERNAME"
ORS_WORKERS=(
    "10.2.7.251|ors-server1"
    "10.2.7.252|ors-server2"
)

# Ensure paramiko is installed for the deploy script
if ! python3 -c "import paramiko" &> /dev/null; then
    echo "📦 Installing paramiko..."
    echo "$SUDO_PASS" | sudo -S apt-get update && echo "$SUDO_PASS" | sudo -S apt-get install -y python3-paramiko || pip3 install --user paramiko
fi

for WORKER_INFO in "${ORS_WORKERS[@]}"; do
    WORKER_IP="${WORKER_INFO%%|*}"
    WORKER_USER="${WORKER_INFO##*|}"
    
    echo "🔄 Pushing update to ORS Worker: $WORKER_IP (User: $WORKER_USER)..."
    python3 -u scripts/deploy_ors_worker.py --host "$WORKER_IP" --user "$WORKER_USER" --password "$ORS_PASS" || echo "  ⚠️ Failed to deploy to $WORKER_IP"
done

echo "===================================================="
echo "  ✅ CI/CD Pipeline Fully Complete!"
echo "===================================================="
