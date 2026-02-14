#!/bin/bash

# COMPREHENSIVE PHASE 2 TESTING SCRIPT
# Tests all features systematically with detailed reporting

echo "🧪 COMPREHENSIVE PHASE 2 TESTING"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test results log
LOG_FILE="phase2_test_results.txt"
echo "Phase 2 Test Results - $(date)" > $LOG_FILE
echo "================================" >> $LOG_FILE

# Helper function
run_test() {
    local test_name=$1
    local test_command=$2
    
    ((TOTAL_TESTS++))
    echo -ne "[$TOTAL_TESTS] Testing: $test_name... "
    
    if eval "$test_command" >> $LOG_FILE 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        echo "[$TOTAL_TESTS] PASS: $test_name" >> $LOG_FILE
        ((PASSED_TESTS++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "[$TOTAL_TESTS] FAIL: $test_name" >> $LOG_FILE
        ((FAILED_TESTS++))
        return 1
    fi
}

echo -e "${BLUE}═══════════════════════════════════${NC}"
echo -e "${BLUE}  SECTION 1: Code Structure Tests  ${NC}"
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo ""

# Test 1: Migration files exist
run_test "Migration files present" \
    "test -f supabase/migrations/20251207_payment_wallet_system.sql && \
     test -f supabase/migrations/20251207_add_payos_columns.sql && \
     test -f supabase/migrations/20251207_phase2_trust_safety.sql && \
     test -f supabase/migrations/20251207_qr_codes_only.sql"

# Test 2: API endpoints exist
run_test "Order status API exists" \
    "test -f app/api/orders/[id]/update-status/route.ts"

run_test "Order timeline API exists" \
    "test -f app/api/orders/[id]/timeline/route.ts"

run_test "Review API exists" \
    "test -f app/api/orders/[id]/review/route.ts"

run_test "Farmer reviews API exists" \
    "test -f app/api/farmers/[id]/reviews/route.ts"

run_test "QR code API exists" \
    "test -f app/api/farmers/[id]/qr-code/route.ts"

run_test "QR scan redirect exists" \
    "test -f app/qr/[code]/route.ts"

# Test 3: UI Components exist
run_test "OrderTimeline component exists" \
    "test -f components/orders/OrderTimeline.tsx"

run_test "ReviewForm component exists" \
    "test -f components/reviews/ReviewForm.tsx"

run_test "FarmerRatingSummary exists" \
    "test -f components/reviews/FarmerRatingSummary.tsx"

run_test "ReviewList component exists" \
    "test -f components/reviews/ReviewList.tsx"

run_test "ShareButton component exists" \
    "test -f components/marketing/ShareButton.tsx"

run_test "QRCodeDisplay component exists" \
    "test -f components/marketing/QRCodeDisplay.tsx"

echo ""
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo -e "${BLUE}  SECTION 2: Dependencies Check    ${NC}"
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo ""

# Test 4: QR code library installed
run_test "qrcode library installed" \
    "grep -q '\"qrcode\"' package.json"

run_test "PayOS SDK installed" \
    "grep -q '\"@payos/node\"' package.json"

run_test "react-confetti installed" \
    "grep -q '\"react-confetti\"' package.json"

echo ""
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo -e "${BLUE}  SECTION 3: Build Verification    ${NC}"
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo ""

# Test 5: TypeScript compilation
echo "Checking TypeScript compilation..."
if npm run build --dry-run > /dev/null 2>&1; then
    run_test "TypeScript compiles without errors" "true"
else
    run_test "TypeScript compiles without errors" "false"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo -e "${BLUE}  SECTION 4: Integration Tests     ${NC}"
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}Note: API integration tests require running server${NC}"
echo -e "${YELLOW}Run: npm run dev (in separate terminal)${NC}"
echo ""

# Manual verification checklist
echo "═══════════════════════════════════"
echo "  MANUAL VERIFICATION CHECKLIST"
echo "═══════════════════════════════════"
echo ""
echo "Database Tables (via Supabase Dashboard):"
echo "  [ ] order_status_history exists"
echo "  [ ] reviews exists"
echo "  [ ] farmer_ratings exists"
echo "  [ ] qr_codes exists"
echo "  [ ] qr_scans exists"
echo ""
echo "Triggers & Functions:"
echo "  [ ] update_farmer_ratings() trigger works"
echo "  [ ] generate_farmer_qr_code() function works"
echo ""
echo "API Endpoints (test with Postman/curl):"
echo "  [ ] POST /api/orders/[id]/update-status"
echo "  [ ] GET /api/orders/[id]/timeline"
echo "  [ ] POST /api/orders/[id]/review"
echo "  [ ] GET /api/farmers/[id]/reviews"
echo "  [ ] GET /api/farmers/[id]/qr-code"
echo "  [ ] GET /qr/[code]"
echo ""
echo "UI Components (visual inspection):"
echo "  [ ] OrderTimeline renders correctly"
echo "  [ ] ReviewForm shows 5-star rating"
echo "  [ ] FarmerRatingSummary displays stats"
echo "  [ ] QRCodeDisplay shows QR image"
echo "  [ ] ShareButton opens menu"
echo ""

# Summary
echo ""
echo "═══════════════════════════════════"
echo "  TEST SUMMARY"
echo "═══════════════════════════════════"
echo -e "Total Tests:  ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✓ ALL AUTOMATED TESTS PASSED!${NC}"
    echo -e "${GREEN}Ready for manual verification${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some tests failed${NC}"
    echo -e "Check $LOG_FILE for details"
    exit 1
fi
