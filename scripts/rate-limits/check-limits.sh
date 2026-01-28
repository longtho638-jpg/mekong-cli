#!/bin/bash

# Check rate limit status for a key
# Usage: ./check-limits.sh <key>
# Example: ./check-limits.sh global:ip:127.0.0.1

if [ -z "$1" ]; then
    echo "Usage: $0 <key>"
    echo "Example: $0 global:ip:127.0.0.1"
    exit 1
fi

KEY=$1
API_URL="http://localhost:8000"
ADMIN_TOKEN="${ADMIN_TOKEN:-admin_token_here}" # Replace with actual token mechanism or use env var

echo "Checking status for key: $KEY"

curl -s -X GET "$API_URL/api/admin/rate-limits/status/$KEY" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq .
