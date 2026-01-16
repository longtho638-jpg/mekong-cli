#!/bin/bash
# 🌉 AntiBridge - First-time Setup for macOS
# Run: chmod +x SETUP_MAC.sh && ./SETUP_MAC.sh

echo ""
echo "🌉 AntiBridge Setup for macOS"
echo "═══════════════════════════════════════"
echo ""

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node -v)"
else
    echo "❌ Node.js not found"
    echo "   Install: brew install node"
    echo "   Or: https://nodejs.org/"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    echo "✅ npm: $(npm -v)"
else
    echo "❌ npm not found"
    exit 1
fi

# Check Tailscale (optional)
echo ""
echo "Checking Tailscale..."
if command -v tailscale &> /dev/null; then
    TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "Not connected")
    echo "✅ Tailscale installed"
    echo "   IP: $TAILSCALE_IP"
else
    echo "⚠️  Tailscale not found (optional for remote access)"
    echo "   Install: brew install tailscale"
fi

# Install dependencies if backend exists
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -d "$SCRIPT_DIR/backend" ]; then
    echo ""
    echo "Installing backend dependencies..."
    cd "$SCRIPT_DIR/backend"
    npm install
    echo "✅ Dependencies installed"
fi

# Make scripts executable
echo ""
echo "Making scripts executable..."
chmod +x "$SCRIPT_DIR"/*.sh 2>/dev/null || true
echo "✅ Scripts ready"

echo ""
echo "═══════════════════════════════════════"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. ./OPEN_ANTIGRAVITY_MAC.sh  (Open IDE with CDP)"
echo "  2. ./START_MAC.sh             (Start server)"
echo "  3. Open http://localhost:8000 in browser"
echo ""
