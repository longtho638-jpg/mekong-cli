#!/bin/bash
# Helper script to run ts-node commands
# Handles pnpm workspace symlinks

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Use pnpm exec for proper workspace resolution
pnpm exec ts-node "$@"
