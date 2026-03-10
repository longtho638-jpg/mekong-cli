#!/bin/bash
# Staging E2E Test Script for Subscription Flows
# Usage: ./scripts/staging-e2e-test.sh

set -e

echo "=== PHASE 5: Staging E2E Tests ==="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL=0
PASSED=0
FAILED=0

# Helper functions
test_api() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local expected_status="$4"
  local data="$5"

  TOTAL=$((TOTAL + 1))
  echo -n "Testing: $name... "

  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi

  status=$(echo "$response" | tail -1)
  body=$(echo "$response" | head -n -1)

  if [ "$status" = "$expected_status" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    PASSED=$((PASSED + 1))
    return 0
  else
    echo -e "${RED}✗ FAILED${NC} (expected $expected_status, got $status)"
    echo "Response: $body"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

# Configuration
BASE_URL="${STAGING_BASE_URL:-http://localhost:3000/api}"
echo "Base URL: $BASE_URL"
echo ""

# Run tests
echo "--- Health Checks ---"
test_api "Health check" "GET" "/health" "200"
test_api "Ready check" "GET" "/ready" "200"
test_api "Metrics endpoint" "GET" "/metrics" "200"

echo ""
echo "--- Subscription API ---"
test_api "Get subscription status" "GET" "/subscription/status" "200"

echo ""
echo "--- License Validation ---"
test_api "Invalid license key" "POST" "/subscription/activate" "500" '{"tier":"INVALID"}'

echo ""
echo "=== Test Summary ==="
echo "Total: $TOTAL"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
