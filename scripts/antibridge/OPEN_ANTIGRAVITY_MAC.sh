#!/bin/bash
# 🌉 AntiBridge - Open Antigravity with CDP (Chrome DevTools Protocol)
# Run: chmod +x OPEN_ANTIGRAVITY_MAC.sh && ./OPEN_ANTIGRAVITY_MAC.sh

CDP_PORT="${CDP_PORT:-9222}"

echo ""
echo "🌉 Opening Antigravity with Remote Debugging"
echo "═══════════════════════════════════════"
echo ""

# Try different browsers/apps
OPENED=false

# Option 1: Antigravity IDE (if installed as app)
if [ -d "/Applications/Antigravity.app" ]; then
    echo "✅ Found Antigravity.app"
    open -a "Antigravity" --args --remote-debugging-port=$CDP_PORT
    OPENED=true
fi

# Option 2: VS Code with Antigravity extension
if [ "$OPENED" = false ] && [ -d "/Applications/Visual Studio Code.app" ]; then
    echo "✅ Found VS Code - opening with remote debugging"
    open -a "Visual Studio Code" --args --remote-debugging-port=$CDP_PORT
    OPENED=true
fi

# Option 3: Chrome (for web-based Antigravity)
if [ "$OPENED" = false ]; then
    if [ -d "/Applications/Google Chrome.app" ]; then
        echo "✅ Opening Chrome with remote debugging on port $CDP_PORT"
        open -a "Google Chrome" --args --remote-debugging-port=$CDP_PORT
        OPENED=true
    elif [ -d "/Applications/Chromium.app" ]; then
        echo "✅ Opening Chromium with remote debugging on port $CDP_PORT"
        open -a "Chromium" --args --remote-debugging-port=$CDP_PORT
        OPENED=true
    fi
fi

if [ "$OPENED" = true ]; then
    echo ""
    echo "📍 CDP Endpoint: http://localhost:$CDP_PORT"
    echo ""
    echo "💡 Tip: AntiBridge can now connect to this debugging port"
    echo "   to send/receive AI commands remotely."
else
    echo "❌ No compatible browser found."
    echo "   Install Chrome: brew install --cask google-chrome"
fi
