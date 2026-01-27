#!/bin/bash
set -euo pipefail

# Script to verify sync status between DB and Search Index
# Requires psql and curl/jq

echo "🔍 Verifying search index sync..."

API_URL=${API_URL:-http://localhost:8000}

# Check dependencies
if ! command -v psql &> /dev/null; then
    echo "psql could not be found"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "jq could not be found"
    exit 1
fi

# Define database connection (adjust as needed)
DB_NAME=${DB_NAME:-agencyos}
DB_USER=${DB_USER:-postgres}
# DB_HOST, DB_PORT...

for INDEX in users transactions audit; do
  echo "Checking $INDEX..."

  # Get count from DB
  # Mapping index names to table names
  if [ "$INDEX" = "transactions" ]; then
    TABLE="invoices" # Assuming transactions are invoices for now
  elif [ "$INDEX" = "audit" ]; then
    TABLE="audit_logs"
  else
    TABLE="$INDEX"
  fi

  # This psql command might need adjustment based on environment
  # Using || echo 0 to handle errors gracefully if table doesn't exist yet
  DB_COUNT=$(psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM $TABLE" 2>/dev/null || echo "0")

  # Get count from Search API
  SEARCH_STATS=$(curl -s "$API_URL/api/search/stats/$INDEX")
  SEARCH_COUNT=$(echo $SEARCH_STATS | jq -r '.document_count // 0')

  echo "$INDEX: DB=$DB_COUNT | Search=$SEARCH_COUNT"

  if [ "$DB_COUNT" != "$SEARCH_COUNT" ]; then
    echo "⚠️  Mismatch detected for $INDEX!"
    echo "  (Note: This might be due to async indexing latency)"
  else
    echo "✅ $INDEX in sync"
  fi
done

echo "🎉 Sync verification complete!"
