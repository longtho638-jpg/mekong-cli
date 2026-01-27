#!/bin/bash
set -euo pipefail

# Scripts to trigger reindexing via the API

INDEX=${1:-all}
API_URL=${API_URL:-http://localhost:8000}
API_KEY=${API_KEY:-dev-secret-key-CHANGE-IN-PRODUCTION} # Use a proper admin key in production

echo "🔍 Starting full reindex for: $INDEX"

if [ "$INDEX" = "all" ]; then
  INDEXES=("users" "transactions" "audit")
else
  INDEXES=("$INDEX")
fi

for idx in "${INDEXES[@]}"; do
  echo "📊 Reindexing: $idx"
  # In a real scenario, you'd probably need authentication headers here
  # For now assuming the endpoint is accessible or using a basic key mechanism if implemented

  RESPONSE=$(curl -s -X POST "$API_URL/api/search/reindex/$idx" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json")

  echo "Response: $RESPONSE"
  echo "✅ Triggered reindex for $idx"
done

echo "🎉 Reindexing triggers complete! Check worker logs for progress."
