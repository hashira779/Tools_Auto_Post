#!/bin/bash
# Install Docker
echo "Installing Docker..."
echo "pTT!CT01" | sudo -S apt update
echo "pTT!CT01" | sudo -S apt install -y docker.io docker-compose-v2
echo "pTT!CT01" | sudo -S systemctl enable docker
echo "pTT!CT01" | sudo -S systemctl start docker
echo "pTT!CT01" | sudo -S usermod -aG docker ubuntu-server

# Build and start the bot container
echo "Starting Bot inside Docker..."
echo "pTT!CT01" | sudo -S docker compose up -d --build

echo ""
echo "✅ Bot is now running via Docker on Ubuntu!"
