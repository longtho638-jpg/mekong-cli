#!/bin/bash
# 🌉 AntiBridge - macOS Start Script
# Run: chmod +x START_MAC.sh && ./START_MAC.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${ANTIBRIDGE_PORT:-8000}"

echo ""
echo "🌉 AntiBridge for macOS"
echo "═══════════════════════════════════════"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install: brew install node"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current: $(node -v)"
    exit 1
fi
echo "✅ Node.js: $(node -v)"

# Check if backend exists
if [ -d "$SCRIPT_DIR/backend" ]; then
    cd "$SCRIPT_DIR/backend"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
    fi
    
    echo "🚀 Starting AntiBridge server on port $PORT..."
    echo ""
    
    # Get IPs
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "N/A")
    TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "N/A")
    
    echo "📍 Access URLs:"
    echo "   Local:     http://localhost:$PORT"
    echo "   LAN:       http://$LOCAL_IP:$PORT"
    if [ "$TAILSCALE_IP" != "N/A" ]; then
        echo "   Tailscale: http://$TAILSCALE_IP:$PORT"
    fi
    echo ""
    echo "Press Ctrl+C to stop"
    echo ""
    
    # Start server
    node server.js
else
    # Fallback: Simple HTTP server for testing
    echo "📁 No backend folder found. Starting simple server..."
    echo ""
    
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "localhost")
    TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "N/A")
    
    echo "📍 Access URLs:"
    echo "   Local:     http://localhost:$PORT"
    echo "   LAN:       http://$LOCAL_IP:$PORT"
    if [ "$TAILSCALE_IP" != "N/A" ]; then
        echo "   Tailscale: http://$TAILSCALE_IP:$PORT"
    fi
    echo ""
    
    # Use Python for simple server
    if command -v python3 &> /dev/null; then
        cd "$SCRIPT_DIR"
        python3 -m http.server $PORT
    else
        echo "❌ Python3 not found for fallback server"
        exit 1
    fi
fi
