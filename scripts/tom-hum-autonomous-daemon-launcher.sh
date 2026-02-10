#!/bin/bash
# ============================================================================
# 🦞 TÔM HÙM — Autonomous Daemon Launcher
#
# One command to start full autonomy:
#   task-watcher.js boots → expect brain spawns in tmux → auto-cto generates
#   missions → task-queue detects → dispatcher executes via CC CLI → loop
#
# Usage: bash scripts/tom-hum-autonomous-daemon-launcher.sh
# Watch: tmux attach -t tom-hum-brain
# Logs:  tail -f ~/tom_hum_cto.log
# Stop:  Ctrl+C (or kill the node process)
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MEKONG_DIR="$(dirname "$SCRIPT_DIR")"
OPENCLAW_DIR="$MEKONG_DIR/apps/openclaw-worker"
LOG_FILE="${TOM_HUM_LOG:-$HOME/tom_hum_cto.log}"

# Verify openclaw-worker exists
if [ ! -f "$OPENCLAW_DIR/task-watcher.js" ]; then
  echo "❌ task-watcher.js not found at $OPENCLAW_DIR"
  exit 1
fi

# Verify expect is installed (needed for interactive brain mode)
if ! command -v expect &>/dev/null; then
  echo "❌ expect not installed. Run: brew install expect"
  exit 1
fi

# Verify tmux is installed (needed for interactive brain mode)
if ! command -v tmux &>/dev/null; then
  echo "❌ tmux not installed. Run: brew install tmux"
  exit 1
fi

# Verify claude CLI is available
if ! command -v claude &>/dev/null; then
  echo "❌ claude CLI not found in PATH"
  exit 1
fi

# Ensure tasks directory exists
mkdir -p "$MEKONG_DIR/tasks/processed"

# Kill stale tmux brain sessions
tmux kill-session -t tom-hum-brain 2>/dev/null || true

# Clear stale IPC files
rm -f /tmp/tom_hum_next_mission.txt /tmp/tom_hum_mission_done

echo ""
echo "  🦞 ═══════════════════════════════════════════════"
echo "  🦞  TÔM HÙM AUTONOMOUS DAEMON"
echo "  🦞  Mode: interactive (expect brain in tmux)"
echo "  🦞  Engine: ${TOM_HUM_ENGINE:-antigravity}"
echo "  🦞  Log: $LOG_FILE"
echo "  🦞  Watch CC CLI: tmux attach -t tom-hum-brain"
echo "  🦞 ═══════════════════════════════════════════════"
echo ""
echo "  Flow: task-watcher → detect mission → dispatch to CC CLI → complete → next"
echo "  Auto-CTO generates Binh Phap tasks when queue empty (30s idle)"
echo ""
echo "  Press Ctrl+C to stop"
echo ""

# Export brain mode to ensure interactive (self-spawning) mode
export TOM_HUM_BRAIN_MODE="${TOM_HUM_BRAIN_MODE:-interactive}"
export MEKONG_DIR="$MEKONG_DIR"

# Start the daemon — node stays in foreground
exec node "$OPENCLAW_DIR/task-watcher.js"
