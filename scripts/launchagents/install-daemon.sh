#!/bin/bash
# 🏯 Revenue Daemon Installation Script
# Installs LaunchAgent for 24/7 background operation

set -e

PLIST_NAME="com.billmentor.revenue-daemon.plist"
SOURCE_DIR="$(dirname "$0")"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
LOG_DIR="$HOME/.mekong/logs"

echo "🏯 Installing Revenue Daemon..."
echo "================================"

# Create directories
mkdir -p "$LAUNCH_AGENTS_DIR"
mkdir -p "$LOG_DIR"

# Copy plist
cp "$SOURCE_DIR/$PLIST_NAME" "$LAUNCH_AGENTS_DIR/"
echo "✅ Copied plist to $LAUNCH_AGENTS_DIR"

# Unload if already loaded
launchctl unload "$LAUNCH_AGENTS_DIR/$PLIST_NAME" 2>/dev/null || true

# Load the agent
launchctl load "$LAUNCH_AGENTS_DIR/$PLIST_NAME"
echo "✅ LaunchAgent loaded"

# Verify
if launchctl list | grep -q "com.billmentor.revenue-daemon"; then
    echo "✅ Revenue Daemon is now running!"
    echo ""
    echo "📋 Commands:"
    echo "   Status:  launchctl list | grep billmentor"
    echo "   Logs:    tail -f ~/.mekong/logs/revenue-daemon.log"
    echo "   Stop:    launchctl unload ~/Library/LaunchAgents/$PLIST_NAME"
    echo "   Start:   launchctl load ~/Library/LaunchAgents/$PLIST_NAME"
else
    echo "❌ Failed to start daemon"
    exit 1
fi

echo ""
echo "🚀 MAX LEVEL automation enabled!"
echo "   → Lead generation: 9 AM daily"
echo "   → Outreach: 10 AM weekdays"
echo "   → Follow-ups: 11 AM weekdays"
echo "   → Reports: 6 PM daily"
