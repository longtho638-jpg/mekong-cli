#!/bin/bash
# Sync AI packages from Claude CLI venv to project venv
# Usage: ./scripts/sync-ai-packages.sh

set -e

echo "🔄 Syncing AI packages from Claude CLI..."

# Source venv
CC_VENV="$HOME/.claude/skills/.venv"
PROJECT_VENV=".venv"

if [ ! -d "$CC_VENV" ]; then
    echo "❌ Claude CLI venv not found at $CC_VENV"
    exit 1
fi

if [ ! -d "$PROJECT_VENV" ]; then
    echo "❌ Project venv not found. Run: python -m venv .venv"
    exit 1
fi

echo "📦 Installing AI packages..."

# Core AI frameworks
$PROJECT_VENV/bin/pip install --quiet \
    autogen-agentchat \
    llama-index \
    llama-index-llms-gemini \
    llama-index-embeddings-gemini \
    instructor \
    litellm \
    google-genai

echo "✅ AI packages synced to project venv!"
echo ""
echo "Verify with:"
echo "  source .venv/bin/activate"
echo "  python -c 'import autogen; print(autogen.__version__)'"
