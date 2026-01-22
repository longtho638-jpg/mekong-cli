#!/bin/bash
# Post-deployment verification script
# Usage: ./verify-deployment.sh [URL]

URL=${1:-"https://agencyos.vercel.app"}
echo "🔍 Verifying deployment at $URL..."

# 1. Check HTTP Status
HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}\n" "$URL")
if [ "$HTTP_STATUS" == "200" ]; then
  echo "✅ Homepage is accessible (200 OK)"
else
  echo "❌ Homepage check failed (Status: $HTTP_STATUS)"
  exit 1
fi

# 2. Check Security Headers
HEADERS=$(curl -s -I "$URL")
if echo "$HEADERS" | grep -q "X-Frame-Options: DENY"; then
  echo "✅ Security headers present"
else
  echo "⚠️  Security headers missing"
fi

# 3. Check Critical Routes
ROUTES=("/login" "/dashboard" "/docs")
for route in "${ROUTES[@]}"; do
  STATUS=$(curl -o /dev/null -s -w "%{http_code}\n" "$URL$route")
  if [ "$STATUS" == "200" ] || [ "$STATUS" == "307" ]; then
    echo "✅ Route $route is reachable ($STATUS)"
  else
    echo "❌ Route $route check failed ($STATUS)"
  fi
done

echo "✅ Verification complete!"
