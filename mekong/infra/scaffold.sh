#!/bin/bash
# Mekong CLI — Infrastructure Scaffold (Cloudflare-only)
# Usage: bash mekong/infra/scaffold.sh <project-name> <scale>
# Scales: solo | startup | scale

set -euo pipefail

PROJECT="${1:?Usage: scaffold.sh <project-name> <scale>}"
SCALE="${2:-startup}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATES="$SCRIPT_DIR/templates"

echo "Mekong Infra Scaffold: $PROJECT ($SCALE)"
echo "=========================================="

mkdir -p "$PROJECT"

case "$SCALE" in
  solo)
    echo "Solo: frontend only (CF Pages)"
    mkdir -p "$PROJECT/frontend"
    cp -r "$TEMPLATES/cf-pages/"* "$PROJECT/frontend/"
    sed -i '' "s/{{PROJECT_NAME}}/$PROJECT/g" "$PROJECT/frontend/wrangler.toml"
    ;;

  startup)
    echo "Startup: frontend + edge API (CF Pages + CF Workers)"
    mkdir -p "$PROJECT/frontend" "$PROJECT/api"
    cp -r "$TEMPLATES/cf-pages/"* "$PROJECT/frontend/"
    cp -r "$TEMPLATES/cf-workers/"* "$PROJECT/api/"
    sed -i '' "s/{{PROJECT_NAME}}/$PROJECT/g" "$PROJECT/frontend/wrangler.toml" "$PROJECT/api/wrangler.toml"
    ;;

  scale)
    echo "Scale: frontend + edge API + backend (all CF Workers)"
    mkdir -p "$PROJECT/frontend" "$PROJECT/api" "$PROJECT/backend"
    cp -r "$TEMPLATES/cf-pages/"* "$PROJECT/frontend/"
    cp -r "$TEMPLATES/cf-workers/"* "$PROJECT/api/"
    cp -r "$TEMPLATES/cf-workers/"* "$PROJECT/backend/"
    sed -i '' "s/{{PROJECT_NAME}}/$PROJECT/g" \
      "$PROJECT/frontend/wrangler.toml" \
      "$PROJECT/api/wrangler.toml" \
      "$PROJECT/backend/wrangler.toml"
    # Rename backend worker to avoid name collision
    sed -i '' "s/name = \"$PROJECT\"/name = \"$PROJECT-backend\"/g" "$PROJECT/backend/wrangler.toml"
    ;;

  *)
    echo "Unknown scale: $SCALE (use: solo|startup|scale)"
    exit 1
    ;;
esac

echo ""
echo "Scaffolded: $PROJECT/"
ls -la "$PROJECT/"
echo ""
echo "Next steps:"
echo "  cd $PROJECT/frontend && npm install && npm run dev"
echo "  Deploy: git push (CF Pages auto-builds) or wrangler deploy (Workers)"
