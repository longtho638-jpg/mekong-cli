#!/bin/bash
# ☁️ TÔM HÙM CLOUD BRAIN LAUNCHER ☁️
export TOM_HUM_BRAIN_MODE=tmux
export MODEL_NAME="qwen3-coder-next" # Cloud cân hết model to

# Start Anthropic Adapter (translates CC CLI → Ollama)
pkill -f "anthropic-adapter.js" 2>/dev/null || true
nohup node scripts/anthropic-adapter.js "http://bore.pub:56256" 11436 > ~/anthropic_adapter.log 2>&1 &
sleep 1
echo "🔄 Anthropic Adapter Started on :11436"

# URL Cloud (via Adapter)
export PROXY_PORT=11434
export ANTHROPIC_BASE_URL="http://localhost:11436"
export ANTHROPIC_AUTH_TOKEN="ollama"
unset ANTHROPIC_API_KEY
export ANTHROPIC_API_KEY=""

echo "🦞 Launching Tôm Hùm with CLOUD BRAIN (Adapter → bore.pub:56256)..."
nohup node apps/openclaw-worker/task-watcher.js > ~/tom_hum.log 2>&1 &
