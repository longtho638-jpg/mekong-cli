#!/bin/bash
# DEPRECATED — Use tom-hum-autonomous-daemon-launcher.sh instead
# This script is kept for backward compatibility only.
echo "⚠️  tom-hum-cc.sh is DEPRECATED"
echo "→  Use: bash scripts/tom-hum-autonomous-daemon-launcher.sh"
echo ""
exec bash "$(dirname "$0")/tom-hum-autonomous-daemon-launcher.sh" "$@"
