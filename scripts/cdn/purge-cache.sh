#!/bin/bash
# Purge Cloudflare Cache Script
# Usage: ./purge-cache.sh [all|tags|urls] [values...]

set -e

# Configuration
ZONE_ID="${CLOUDFLARE_ZONE_ID}"
API_TOKEN="${CLOUDFLARE_API_TOKEN}"

if [ -z "$ZONE_ID" ] || [ -z "$API_TOKEN" ]; then
  echo "Error: CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN must be set."
  exit 1
fi

MODE=$1
shift

if [ -z "$MODE" ]; then
  echo "Usage: $0 [all|tags|urls] [values...]"
  echo "Examples:"
  echo "  $0 all"
  echo "  $0 tags tag1 tag2"
  echo "  $0 urls https://example.com/page1 https://example.com/page2"
  exit 1
fi

purge_all() {
  echo "Purging EVERYTHING..."
  curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
     -H "Authorization: Bearer $API_TOKEN" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'
}

purge_tags() {
  echo "Purging tags: $@"
  # Construct JSON array of tags
  TAGS_JSON=$(printf '"%s",' "$@")
  TAGS_JSON="[${TAGS_JSON%,}]"

  curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
     -H "Authorization: Bearer $API_TOKEN" \
     -H "Content-Type: application/json" \
     --data "{\"tags\":$TAGS_JSON}"
}

purge_urls() {
  echo "Purging URLs: $@"
  # Construct JSON array of URLs
  URLS_JSON=$(printf '"%s",' "$@")
  URLS_JSON="[${URLS_JSON%,}]"

  curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
     -H "Authorization: Bearer $API_TOKEN" \
     -H "Content-Type: application/json" \
     --data "{\"files\":$URLS_JSON}"
}

case "$MODE" in
  all)
    purge_all
    ;;
  tags)
    purge_tags "$@"
    ;;
  urls)
    purge_urls "$@"
    ;;
  *)
    echo "Invalid mode: $MODE"
    exit 1
    ;;
esac

echo -e "\nDone."
