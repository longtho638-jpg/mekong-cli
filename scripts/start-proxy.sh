#!/bin/bash
# 🏯 Antigravity Proxy Starter
# Auto-start wrapper for LaunchAgent daemon

export PATH="/opt/homebrew/bin:$PATH"
export NODE_ENV="production"

# Log location
LOG_DIR="$HOME/.mekong/logs"
mkdir -p "$LOG_DIR"

echo "[$(date)] Starting Antigravity Proxy..." >> "$LOG_DIR/proxy.log"

# Start proxy (blocking - LaunchAgent will manage lifecycle)
exec antigravity-claude-proxy start 2>&1 | tee -a "$LOG_DIR/proxy.log"
