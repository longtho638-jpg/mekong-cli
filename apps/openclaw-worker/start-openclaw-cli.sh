#!/bin/bash
# Start CC CLI for openclaw-worker with Antigravity Proxy
# Run this from a FRESH terminal (outside any Claude Code session)

unset CLAUDECODE

cd "$(dirname "$0")"

ANTHROPIC_BASE_URL=http://127.0.0.1:11436 \
  claude \
  --model claude-sonnet-4-6-20250514 \
  --mcp-config /Users/macbookprom1/mekong-cli/.claude/mcp.json \
  --dangerously-skip-permissions
