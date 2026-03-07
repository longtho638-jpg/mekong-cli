#!/bin/bash
# Build with cache support
# Checks cache first, restores if hit, builds and caches if miss

set -e

# Use direct ts-node path to avoid pnpm symlink issues
TS_NODE="../../node_modules/.pnpm/ts-node@10.9.2_@swc+core@1.15.18_@swc+helpers@0.5.19__@types+node@20.19.35_typescript@5.9.3/node_modules/ts-node/dist/bin.js"
CACHE_SCRIPT="node $TS_NODE"

echo "=== Build Cache System ==="

# Generate cache key and check
if $CACHE_SCRIPT src/utils/build-cache.ts check 2>/dev/null; then
  echo "Cache HIT - restoring..."
  $CACHE_SCRIPT src/utils/build-cache.ts restore
  exit 0
fi

echo "Cache MISS - building fresh..."
npm run build:clean

# Save to cache after successful build
$CACHE_SCRIPT src/utils/build-cache.ts save

echo "✅ Build complete"
