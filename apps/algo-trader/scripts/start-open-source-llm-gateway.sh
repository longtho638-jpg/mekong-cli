#!/bin/bash
# Start Open-Source LLM Gateway — Drop-in thay thế Antigravity Proxy
# Port 9191 (KHÔNG ĐỔI — Tôm Hùm vẫn gọi localhost:9191)
#
# Usage:
#   ./scripts/start-open-source-llm-gateway.sh [--local-only]
#
# Prerequisites:
#   pip install litellm[proxy]
#   curl -fsSL https://ollama.com/install.sh | sh
#   ollama pull qwen2.5-coder:7b-instruct-q4_K_M
#   ollama pull phi4:14b-q4_K_M

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/../config/litellm-open-source-gateway-config.yaml"
PORT=9191
LOG_FILE="${HOME}/litellm-gateway.log"

echo "🦞 OpenClaw Open-Source LLM Gateway"
echo "════════════════════════════════════"

# 1. Check Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "⚠️  Ollama not running. Starting..."
  ollama serve &
  sleep 3
fi

# 2. Check models available
echo "📦 Checking local models..."
MODELS=$(curl -s http://localhost:11434/api/tags 2>/dev/null | grep -o '"name":"[^"]*"' | head -5)
if [ -z "$MODELS" ]; then
  echo "❌ No models found. Pulling defaults..."
  ollama pull qwen2.5-coder:7b-instruct-q4_K_M
  ollama pull phi4:14b-q4_K_M
fi
echo "✅ Models: $MODELS"

# 3. Kill existing proxy on port 9191
if lsof -ti:$PORT > /dev/null 2>&1; then
  echo "⚠️  Killing existing process on port $PORT..."
  kill $(lsof -ti:$PORT) 2>/dev/null || true
  sleep 1
fi

# 4. Start LiteLLM Gateway
echo "🚀 Starting LiteLLM Gateway on port $PORT..."
echo "📝 Config: $CONFIG_FILE"
echo "📝 Log: $LOG_FILE"

if [ "$1" = "--local-only" ]; then
  echo "🔒 LOCAL-ONLY mode: No cloud API fallback"
  export ANTHROPIC_API_KEY="disabled"
  export GOOGLE_API_KEY="disabled"
fi

export LITELLM_MASTER_KEY="${LITELLM_MASTER_KEY:-openclaw-local}"

nohup litellm \
  --config "$CONFIG_FILE" \
  --port $PORT \
  --host 0.0.0.0 \
  > "$LOG_FILE" 2>&1 &

echo "PID: $!"
sleep 2

# 5. Verify
if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
  echo "✅ Gateway ALIVE on port $PORT"
  echo ""
  echo "Tôm Hùm sẵn sàng — chạy bình thường không cần đổi gì."
  echo "curl http://localhost:$PORT/health"
else
  echo "❌ Gateway failed to start. Check $LOG_FILE"
  tail -10 "$LOG_FILE"
  exit 1
fi
