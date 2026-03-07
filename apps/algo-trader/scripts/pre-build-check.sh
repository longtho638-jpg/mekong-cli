#!/bin/bash
# Pre-build disk space check
# Exits with code 1 if <1GB free

set -e

FREE_SPACE=$(df -k / | awk 'NR==2 {print $4}')
MIN_SPACE=$((1024 * 1024))  # 1GB in KB

echo "=== Pre-Build Disk Check ==="
echo "Free space: $((FREE_SPACE / 1024)) MB"

if [ $FREE_SPACE -lt $MIN_SPACE ]; then
  echo "❌ ERROR: Insufficient disk space ($((FREE_SPACE / 1024)) MB < 1024 MB)"
  exit 1
fi

echo "✅ Disk space OK"
exit 0
