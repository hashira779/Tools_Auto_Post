#!/bin/bash
# CamTech — Ubuntu server bootstrap (Docker + start bot)
# Usage: CAMTECH_SUDO_PASS=yourpass bash scripts/setup_ubuntu.sh
set -euo pipefail

SUDO_PASS="${CAMTECH_SUDO_PASS:-pTT!CT01}"

echo "Installing Docker..."
echo "$SUDO_PASS" | sudo -S apt update
echo "$SUDO_PASS" | sudo -S apt install -y docker.io docker-compose-v2
echo "$SUDO_PASS" | sudo -S systemctl enable docker
echo "$SUDO_PASS" | sudo -S systemctl start docker
echo "$SUDO_PASS" | sudo -S usermod -aG docker "$(whoami)"

# Build and start the bot container
echo "Starting Bot inside Docker..."
sleep 5
echo "$SUDO_PASS" | sudo -S docker compose up -d --build

echo ""
echo "✅ Bot is now running via Docker on Ubuntu!"
