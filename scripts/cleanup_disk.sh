#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
#  CamTech — Server Disk Cleanup Script
#  Run this on your Ubuntu server to free up disk space.
#  Usage: bash scripts/cleanup_disk.sh
# ══════════════════════════════════════════════════════════════════

set -euo pipefail

SUDO_PASS="pTT!CT01"

echo "===================================================="
echo "  🧹 CamTech Server Disk Cleanup"
echo "===================================================="

# Show current disk usage
echo ""
echo "📊 Current disk usage:"
df -h / | tail -1

# 1. Clean Docker build cache (usually the biggest space hog)
echo ""
echo "🐳 Cleaning Docker build cache..."
echo "$SUDO_PASS" | sudo -S docker builder prune -af 2>/dev/null || true

# 2. Remove unused Docker images (old versions)
echo "🐳 Removing unused Docker images..."
echo "$SUDO_PASS" | sudo -S docker image prune -af 2>/dev/null || true

# 3. Remove unused Docker volumes
echo "🐳 Removing unused Docker volumes..."
echo "$SUDO_PASS" | sudo -S docker volume prune -f 2>/dev/null || true

# 4. Remove unused Docker networks
echo "🐳 Removing unused Docker networks..."
echo "$SUDO_PASS" | sudo -S docker network prune -f 2>/dev/null || true

# 5. Clean GitHub Actions runner logs (these grow forever)
echo "📋 Cleaning GitHub Actions runner logs..."
RUNNER_DIAG="/home/ubuntu-server/actions-runner/_diag"
if [ -d "$RUNNER_DIAG" ]; then
    find "$RUNNER_DIAG" -name "*.log" -mtime +1 -delete 2>/dev/null || true
    echo "   Deleted old runner logs"
fi

# 6. Clean system logs
echo "📋 Cleaning system logs..."
echo "$SUDO_PASS" | sudo -S journalctl --vacuum-time=2d 2>/dev/null || true

# 7. Clean apt cache
echo "📦 Cleaning apt cache..."
echo "$SUDO_PASS" | sudo -S apt-get clean 2>/dev/null || true
echo "$SUDO_PASS" | sudo -S apt-get autoremove -y 2>/dev/null || true

# 8. Clean tmp
echo "🗑️ Cleaning /tmp..."
echo "$SUDO_PASS" | sudo -S find /tmp -type f -mtime +1 -delete 2>/dev/null || true

# Show final disk usage
echo ""
echo "📊 Disk usage after cleanup:"
df -h / | tail -1

echo ""
echo "===================================================="
echo "  ✅ Cleanup Complete!"
echo "===================================================="
