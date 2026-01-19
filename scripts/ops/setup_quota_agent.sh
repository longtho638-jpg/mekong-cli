#!/bin/bash
# 🏯 Quota Auto LaunchAgent Setup
# Installs LaunchAgent for auto quota monitoring

set -e

PLIST_NAME="com.mekong.quota-auto.plist"
PLIST_SRC="$(dirname "$0")/$PLIST_NAME"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"
LOG_DIR="$HOME/.mekong/logs"

echo "🏯 Quota Auto LaunchAgent Setup"
echo "================================"

# Create log directory
mkdir -p "$LOG_DIR"
echo "✅ Created log directory: $LOG_DIR"

# Check if already loaded
if launchctl list | grep -q "com.mekong.quota-auto"; then
    echo "⚠️ LaunchAgent already loaded, unloading first..."
    launchctl unload "$PLIST_DEST" 2>/dev/null || true
fi

# Copy plist to LaunchAgents
cp "$PLIST_SRC" "$PLIST_DEST"
echo "✅ Copied plist to: $PLIST_DEST"

# Load the agent
launchctl load "$PLIST_DEST"
echo "✅ LaunchAgent loaded!"

# Verify
if launchctl list | grep -q "com.mekong.quota-auto"; then
    echo ""
    echo "🎉 SUCCESS! Quota auto-monitoring is now active."
    echo ""
    echo "📋 Status:"
    launchctl list | grep "com.mekong.quota-auto"
    echo ""
    echo "📁 Logs:"
    echo "   stdout: $LOG_DIR/quota-auto.log"
    echo "   stderr: $LOG_DIR/quota-auto.error.log"
    echo ""
    echo "🛑 To stop:"
    echo "   launchctl unload ~/Library/LaunchAgents/$PLIST_NAME"
    echo ""
    echo "🔄 To restart:"
    echo "   launchctl unload ~/Library/LaunchAgents/$PLIST_NAME"
    echo "   launchctl load ~/Library/LaunchAgents/$PLIST_NAME"
else
    echo "❌ Failed to load LaunchAgent"
    exit 1
fi
