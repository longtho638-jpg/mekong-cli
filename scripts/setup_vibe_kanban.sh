#!/bin/bash
# 🏯 AgencyOS - Vibe Kanban Setup
# Automates the deployment of the Kanban Board for agents.

set -e

REPO_URL="https://github.com/BloopAI/vibe-kanban.git"
INSTALL_DIR="external/vibe-kanban"
ENV_FILE=".env"

echo "🏯 AgencyOS: Setting up Vibe Kanban..."

# 1. Directory Setup
if [ -d "$INSTALL_DIR" ]; then
    echo "📍 Directory $INSTALL_DIR exists. Pulling latest..."
    cd "$INSTALL_DIR"
    git pull
else
    echo "📍 Cloning Vibe Kanban from $REPO_URL..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# 2. Dependencies
echo "📦 Installing dependencies..."
if [ -f "package.json" ]; then
    npm install
elif [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
elif [ -f "Cargo.toml" ]; then
    echo "⚠️  Rust project detected. Ensure cargo is installed."
fi

# 3. Env Configuration
echo "⚙️  Configuring environment..."
if [ ! -f ".env" ]; then
    echo "VIBE_PORT=3000" > .env
    echo "VIBE_SECRET=$(openssl rand -hex 16)" >> .env
fi

# 4. Launch Instruction
echo "✅ Setup complete!"
echo ""
echo "To start the board:"
echo "  cd $INSTALL_DIR && npm run dev  # or appropriate start command"
echo ""
echo "Then update your AgencyOS .env:"
echo "  VIBE_KANBAN_URL=http://localhost:3000"
echo "  VIBE_KANBAN_TOKEN=... (if applicable)"
