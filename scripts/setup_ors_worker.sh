#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
#  CamTech — ORS Worker Node Setup Script
# ══════════════════════════════════════════════════════════════════
#  Run this on a fresh Ubuntu ORS server to:
#    1. Install Docker
#    2. Clone the CamTech repo
#    3. Deploy AI Orchestrator + Ollama
#    4. Pull the LLM models
#
#  Usage:
#    bash setup_ors_worker.sh
# ══════════════════════════════════════════════════════════════════

set -euo pipefail

REPO_URL="https://github.com/hashira779/Tools_Auto_Post.git"
APP_DIR="/home/$(whoami)/CamTech"

echo "════════════════════════════════════════════════════"
echo "  🚀 CamTech ORS Worker Setup"
echo "════════════════════════════════════════════════════"

# ── 1. Install Docker if not present ──────────────────────────
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    sudo apt-get update -y
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Allow current user to run docker without sudo
    sudo usermod -aG docker $(whoami)
    echo "✅ Docker installed successfully!"
else
    echo "✅ Docker already installed: $(docker --version)"
fi

# ── 2. Clone or update the CamTech repo ──────────────────────
if [ -d "$APP_DIR" ]; then
    echo "🔄 Updating existing CamTech repo..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "📥 Cloning CamTech repo..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# ── 3. Create .env file with Supabase credentials ────────────
if [ ! -f "$APP_DIR/.env" ]; then
    echo "📝 Creating .env file..."
    cat > "$APP_DIR/.env" << 'EOF'
# ── Supabase Auth (Required for JWT validation) ──
SUPABASE_URL=https://icouardbzhytnozaordc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljb3VhcmRiemh5dG5vemFvcmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NzY3NjAsImV4cCI6MjEwMjQ1Mjc2MH0.rDHOKRw-Kw6W7jHRrmIvaqelCwzDMaZshio-4d2p2hw

# ── Database points to Main Server ──
DATABASE_URL=postgresql://camtech:camtechpassword@10.1.0.11:5432/camtech
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# ── 4. Build and start AI services ───────────────────────────
echo "🔨 Building and starting AI services..."
cd "$APP_DIR"
docker compose -f docker-compose.ors-worker.yml up -d --build

# ── 5. Pull LLM models ──────────────────────────────────────
echo "🧠 Pulling LLM models (this may take a while)..."
sleep 10  # Wait for Ollama to fully start

docker exec ors-ollama ollama pull llama3.2
echo "✅ llama3.2 pulled"

docker exec ors-ollama ollama pull llama3.2-vision || echo "⚠️ llama3.2-vision pull skipped (optional)"

# ── 6. Verify ────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════"
echo "  🎉 ORS Worker Setup Complete!"
echo "════════════════════════════════════════════════════"
echo ""
echo "  Services running:"
docker ps --format "  - {{.Names}} ({{.Status}})"
echo ""
echo "  AI Orchestrator API: http://$(hostname -I | awk '{print $1}'):8100"
echo "  Ollama LLM:          running internally"
echo ""
echo "  The main server's Nginx will automatically"
echo "  detect this worker and start load-balancing!"
echo "════════════════════════════════════════════════════"
