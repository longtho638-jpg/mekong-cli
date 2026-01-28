#!/bin/bash

# Reset rate limit for a key
# Usage: ./reset-limits.sh <key>
# Example: ./reset-limits.sh global:ip:127.0.0.1

if [ -z "$1" ]; then
    echo "Usage: $0 <key>"
    echo "Example: $0 global:ip:127.0.0.1"
    exit 1
fi

KEY=$1
API_URL="http://localhost:8000"
ADMIN_TOKEN="${ADMIN_TOKEN:-admin_token_here}"

echo "Resetting limit for key: $KEY"

curl -s -X DELETE "$API_URL/api/admin/rate-limits/reset/$KEY" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq .
