#!/bin/bash

# Configuration
FUNCTION_URL="http://localhost:54321/functions/v1/gumroad-webhook"
SECRET="test_secret_123"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🧪 Testing Gumroad Webhook..."

# 1. Test Missing Secret (Should Fail 401)
echo -n "1. Testing Missing Secret... "
RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sale_id=sale_1&email=buyer@test.com&product_id=prod_1&price=1000" \
  "$FUNCTION_URL")

if [ "$RESPONSE_CODE" == "401" ]; then
    echo -e "${GREEN}PASS${NC} (401 Unauthorized)"
else
    echo -e "${RED}FAIL${NC} (Got $RESPONSE_CODE)"
fi

# 2. Test Valid Sale (Should Pass 200)
# Note: Requires GUMROAD_WEBHOOK_SECRET to be set in local env to 'test_secret_123'
echo -n "2. Testing Valid Sale... "
RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sale_id=sale_$(date +%s)&email=buyer@test.com&product_id=prod_1&price=5000&referrer=ANTIGRAVITY-TESTUSER" \
  "$FUNCTION_URL?secret=$SECRET")

if [ "$RESPONSE_CODE" == "200" ]; then
    echo -e "${GREEN}PASS${NC} (200 OK)"
else
    echo -e "${RED}FAIL${NC} (Got $RESPONSE_CODE)"
    # Show output for debugging
    curl -s -X POST \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "sale_id=sale_$(date +%s)&email=buyer@test.com&product_id=prod_1&price=5000&referrer=ANTIGRAVITY-TESTUSER" \
      "$FUNCTION_URL?secret=$SECRET"
    echo ""
fi

# 3. Test Viral Loop (Referral Increment)
# This assumes 'TESTUSER' exists in referrals table.
# You might need to seed it first:
# INSERT INTO referrals (referrer_code, referrer_email) VALUES ('TESTUSER', 'referrer@test.com');

echo -e "\n⚠️  Make sure to run 'supabase start' and seed the database first!"
echo "    Insert seed data:"
echo "    INSERT INTO referrals (referrer_code, referrer_email) VALUES ('TESTUSER', 'referrer@test.com');"
