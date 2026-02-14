#!/bin/bash

# Integration Test Suite for Sa Dec Flower Hunt
# Tests critical user flows end-to-end

set -e  # Exit on first error

echo "🧪 Running Integration Tests..."
echo "================================"

BASE_URL="http://localhost:3000"
ADMIN_API="$BASE_URL/api/admin"
SHOP_API="$BASE_URL/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Helper function to test HTTP endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Testing: $name... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status)"
        ((FAILED++))
        return 1
    fi
}

# Helper function to test JSON API
test_json_api() {
    local name=$1
    local url=$2
    
    echo -n "Testing: $name... "
    
    response=$(curl -s "$url")
    
    if echo "$response" | grep -q "error"; then
        echo -e "${RED}✗ FAIL${NC} (API returned error)"
        echo "Response: $response"
        ((FAILED++))
        return 1
    elif [ -z "$response" ]; then
        echo -e "${RED}✗ FAIL${NC} (Empty response)"
        ((FAILED++))
        return 1
    else
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    fi
}

echo ""
echo "🌐 Frontend Tests"
echo "----------------"

test_endpoint "Homepage" "$BASE_URL/" 200
test_endpoint "Scan Page" "$BASE_URL/scan" 200
test_endpoint "Blog Page" "$BASE_URL/blog" 200
test_endpoint "Partner Page" "$BASE_URL/partner" 200
test_endpoint "Admin Dashboard (nested)" "$BASE_URL/admin" 200
test_endpoint "Farmer Dashboard (nested)" "$BASE_URL/farmer" 200
test_endpoint "Offline Page" "$BASE_URL/offline" 200

echo ""
echo "📡 API Tests"
echo "----------------"

test_json_api "Admin Stats API" "$ADMIN_API/stats"
test_json_api "Admin Revenue API" "$ADMIN_API/revenue"
test_json_api "Admin Live Metrics API" "$ADMIN_API/live-metrics"

echo ""
echo "🔍 Static Assets"
echo "----------------"

test_endpoint "PWA Manifest" "$BASE_URL/manifest.json" 200
test_endpoint "Service Worker" "$BASE_URL/service-worker.js" 200
test_endpoint "Icon 192" "$BASE_URL/icon-192x192.png" 200
test_endpoint "Icon 512" "$BASE_URL/icon-512x512.png" 200

echo ""
echo "🛡️ Error Handling Tests"
echo "----------------"

test_endpoint "404 Page" "$BASE_URL/nonexistent-page" 404

echo ""
echo "================================"
echo "📊 Test Results Summary"
echo "================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed.${NC}"
    exit 1
fi
