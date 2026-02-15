#!/bin/bash
# 🦞 Tôm Hùm Native Ollama Launch Script
# Bypasses ollama_bridge.py for maximum speed

export TOM_HUM_BRAIN_MODE=tmux
export MODEL_NAME="glm-5:cloud"
# Point directly to Ollama port 11434 (Native Anthropic API support in v0.14+)
# Point directly to Ollama port 11434 (Native Anthropic API support in v0.14+)
export PROXY_PORT=11434 
# Standard Ollama base URL (client appends /v1/messages)
export ANTHROPIC_BASE_URL="http://127.0.0.1:11434"
export ANTHROPIC_AUTH_TOKEN="ollama"
export ANTHROPIC_API_KEY=""

echo "🦞 Launching Tôm Hùm with NATIVE Ollama (Port 11434)..."
nohup node apps/openclaw-worker/task-watcher.js > ~/tom_hum.log 2>&1 &
