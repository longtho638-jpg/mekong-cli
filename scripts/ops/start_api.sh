#!/bin/bash
# 🔌 Start Antigravity API Server for OpenCode
# Usage: ./scripts/start_api.sh

cd "$(dirname "$0")/.."

# Activate venv if exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

echo "🏯 Starting Antigravity API Server..."
echo "   Endpoints: http://localhost:8000/api/code/*"
echo "   Docs: http://localhost:8000/docs"
echo ""

# Start uvicorn
python3 -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload
