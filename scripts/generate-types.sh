#!/bin/bash
PROJECT_ROOT="/Users/macbookprom1/mekong-cli"
# Use the backend virtual environment
VENV_PATH="$PROJECT_ROOT/backend/.venv"
PYTHON="$VENV_PATH/bin/python3"
PYDANTIC2TS="$VENV_PATH/bin/pydantic2ts"

# Add node_modules/.bin to PATH so pydantic2ts can find json2ts
export PATH="$PATH:$PROJECT_ROOT/node_modules/.bin"
export PYTHONPATH="$PROJECT_ROOT"

echo "PATH: $PATH"
echo "Which json2ts: $(which json2ts)"
echo "PYTHONPATH: $PYTHONPATH"

# Ensure pydantic-to-typescript is installed
"$PYTHON" -m pip install pydantic-to-typescript

# Generate types
"$PYDANTIC2TS" --module backend.models --output "$PROJECT_ROOT/apps/dashboard/types/generated.ts" --json2ts-cmd "json2ts"
