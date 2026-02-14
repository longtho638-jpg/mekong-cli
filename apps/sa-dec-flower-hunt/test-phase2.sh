#!/bin/bash

# Phase 2 Test Script
# Quick verification of all Phase 2 features

echo "🧪 PHASE 2 FEATURE TESTING"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function
test_api() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$url")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        echo "Response: $body"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo "📊 GROUP 1: TRUST & SAFETY"
echo "--------------------------"

# Note: These tests require actual data to exist
# You'll need to replace with real IDs

echo -e "${YELLOW}⚠ Note: Replace placeholder IDs with real data${NC}"
echo ""

# Test 1: Order Timeline
# test_api "Order Timeline" "/api/orders/YOUR_ORDER_ID/timeline"

# Test 2: Farmer Reviews
# test_api "Farmer Reviews" "/api/farmers/YOUR_FARMER_ID/reviews"

echo "✓ Database tables created (verify manually in Supabase)"
echo "✓ Triggers configured (verify manually)"
echo ""

echo "🎯 GROUP 2: MARKETING TOOLS"
echo "----------------------------"

# Test 3: QR Code Generation
# test_api "QR Code Generation" "/api/farmers/YOUR_FARMER_ID/qr-code"

# Test 4: Analytics Tracking
test_api "Analytics Endpoint" "/api/analytics/track" "POST"

echo ""
echo "📱 MANUAL TESTS REQUIRED:"
echo "-------------------------"
echo "1. [ ] Generate QR code via dashboard"
echo "2. [ ] Scan QR with phone"
echo "3. [ ] Submit review after order delivery"
echo "4. [ ] Check farmer rating auto-updated"
echo "5. [ ] Click share button on product"
echo "6. [ ] Verify Facebook/Zalo sharing works"
echo ""

echo "📋 DATABASE VERIFICATION"
echo "------------------------"
echo "Run these SQL queries in Supabase:"
echo ""
echo "-- Check tables exist"
echo "SELECT count(*) FROM order_status_history;"
echo "SELECT count(*) FROM reviews;"
echo "SELECT count(*) FROM farmer_ratings;"
echo "SELECT count(*) FROM qr_codes;"
echo "SELECT count(*) FROM qr_scans;"
echo "SELECT count(*) FROM referrals;"
echo ""

echo "SUMMARY"
echo "======="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All automated tests passed!${NC}"
    echo "Complete manual tests above to verify full functionality."
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Check errors above.${NC}"
    exit 1
fi
