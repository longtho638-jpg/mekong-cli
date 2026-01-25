# Task 09: Test Suite Execution

**Status:** Ready to Execute
**Priority:** High
**Estimated Time:** 15-25 minutes
**Dependencies:** Backend dependencies installed
**Terminal:** #10

---

## 🎯 Objective

Run full test suite (unit + integration tests), generate coverage report, and validate that critical paths have ≥80% test coverage.

---

## 📋 WIN-WIN-WIN Validation

### 👑 ANH (Owner) WINS:
- Code quality confidence
- Reduced regression bugs
- Faster debugging (test logs)

### 🏢 AGENCY WINS:
- Professional development practices
- Client trust (thorough testing)
- Easier refactoring (test safety net)

### 🚀 CLIENT/STARTUP WINS:
- Reliable features
- Fewer production bugs
- Predictable behavior

✅ **All 3 parties WIN** → Proceed

---

## ⚡ Execution Commands

```bash
cd /Users/macbookprom1/mekong-cli/backend

echo "=== Test Suite Execution ==="

# Activate venv
source .venv/bin/activate

# Install test dependencies
echo "Installing test dependencies..."
pip install pytest pytest-cov pytest-asyncio pytest-mock --quiet

# Run unit tests with coverage
echo ""
echo "=== Running Unit Tests ==="
pytest tests/unit/ -v \
  --cov=backend \
  --cov-report=term \
  --cov-report=html:htmlcov \
  --tb=short \
  --maxfail=5 \
  || echo "⚠️ Some unit tests failed (see output above)"

# Run integration tests
echo ""
echo "=== Running Integration Tests ==="
pytest tests/integration/ -v \
  --tb=short \
  --maxfail=3 \
  || echo "⚠️ Some integration tests failed (see output above)"

# Generate detailed coverage report
echo ""
echo "=== Generating Coverage Report ==="
pytest \
  --cov=backend \
  --cov-report=html:htmlcov \
  --cov-report=term-missing \
  --cov-fail-under=70 \
  -v \
  tests/

# Display coverage summary
echo ""
echo "=== Coverage Summary ==="
coverage report --skip-covered | tail -n 20

# Check for untested critical files
echo ""
echo "=== Checking Coverage of Critical Files ==="
CRITICAL_FILES=(
  "backend/api/payments/paypal.py"
  "backend/api/payments/stripe.py"
  "backend/services/license_service.py"
  "backend/services/payment_service.py"
)

for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    COV=$(coverage report "$file" 2>/dev/null | tail -n 1 | awk '{print $NF}')
    if [ -n "$COV" ]; then
      echo "  $file: $COV coverage"
    else
      echo "  ⚠️ $file: No coverage data"
    fi
  else
    echo "  ⚠️ $file: File not found"
  fi
done

# Generate test summary report
echo ""
echo "=== Generating Test Summary Report ==="
cat > /tmp/test-summary-report.md << 'EOF'
# Test Suite Execution Report

**Date:** $(date)
**Coverage Target:** ≥80%

## Test Results

### Unit Tests
- Location: tests/unit/
- Status: [See output above]

### Integration Tests
- Location: tests/integration/
- Status: [See output above]

## Coverage Analysis

### Overall Coverage
[See coverage report above]

### Critical Files Coverage
- Payment Service: [See output above]
- License Service: [See output above]
- PayPal API: [See output above]
- Stripe API: [See output above]

## Recommendations

1. **If coverage <70%:**
   - Add unit tests for uncovered functions
   - Focus on critical payment/license paths first

2. **If tests failing:**
   - Fix failing tests before deployment
   - Document known issues in GitHub Issues

3. **Test Expansion:**
   - Add E2E tests (Playwright/Cypress)
   - Add load tests (Locust)
   - Add security tests (OWASP ZAP)

## HTML Coverage Report
Open in browser: file:///Users/macbookprom1/mekong-cli/backend/htmlcov/index.html

EOF

cat /tmp/test-summary-report.md

echo ""
echo "=== Test Suite Execution Complete ==="
echo "HTML Coverage Report: backend/htmlcov/index.html"
echo "Open in browser to view detailed coverage"
```

---

## ✅ Success Criteria

- [ ] All unit tests pass (or failures documented)
- [ ] All integration tests pass (or failures documented)
- [ ] Overall test coverage ≥70% (target: ≥80%)
- [ ] Critical files have ≥80% coverage:
  - `backend/api/payments/paypal.py`
  - `backend/api/payments/stripe.py`
  - `backend/services/license_service.py`
  - `backend/services/payment_service.py`
- [ ] HTML coverage report generated
- [ ] No import errors during test execution

---

## 🔧 Failure Recovery

### Tests Fail Due to Missing Dependencies
```bash
pip install -r requirements.txt --force-reinstall
pip install pytest pytest-cov pytest-asyncio pytest-mock
```

### Database Connection Errors in Tests
```bash
# Check test database configuration
cat backend/pytest.ini

# Use in-memory SQLite for tests (if not already)
# Add to conftest.py:
# SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
```

### Coverage Below Target (<70%)
```bash
# Find untested files
coverage report --skip-covered | grep "0%"

# Add basic tests for critical files
mkdir -p tests/unit/services
cat > tests/unit/services/test_license_service.py << 'EOF'
import pytest
from backend.services.license_service import LicenseService

def test_generate_license():
    service = LicenseService()
    license_key = service.generate("tenant123", "pro", 365)
    assert license_key.startswith("AGY-")
    assert "tenant123" in license_key
EOF

# Re-run tests
pytest tests/unit/services/test_license_service.py -v
```

### Specific Test Failures
```bash
# Run single failing test with verbose output
pytest tests/unit/test_payments.py::test_paypal_webhook -vvs

# Run tests with debugging
pytest --pdb tests/unit/test_payments.py

# Skip known broken tests (temporarily)
pytest -m "not broken" tests/
```

---

## 📊 Post-Task Validation

```bash
# Count total tests
TEST_COUNT=$(pytest --collect-only -q | grep "test session starts" -A 1000 | grep -c "test_")
echo "Total tests: $TEST_COUNT"

# Check coverage percentage
COVERAGE=$(coverage report | tail -n 1 | awk '{print $NF}')
echo "Overall coverage: $COVERAGE"

# List files with <50% coverage
coverage report --skip-covered | awk '$NF ~ /%/ && int($NF) < 50 {print $1, $NF}'
```

**Expected Output:**
- Total tests: 50+ tests
- Overall coverage: ≥70%
- Critical files: ≥80% coverage

---

## 🚀 Next Steps After Success

1. **If All Tests Pass:**
   - Commit test improvements: `git add tests/ && git commit -m "test: improve coverage to 80%"`
   - Proceed to Task 10: Deployment Readiness Check

2. **If Tests Fail:**
   - Document failures in GitHub Issues
   - Fix critical test failures (payment, license generation)
   - Re-run test suite
   - DO NOT proceed to deployment until critical tests pass

3. **Test Expansion (Post-Deployment):**
   - Add E2E tests (Playwright) for critical user flows
   - Add load tests (Locust) for API endpoints
   - Set up CI/CD test automation (GitHub Actions)

---

**Report:** `echo "TASK 09 COMPLETE - TESTS: $TEST_COUNT, COVERAGE: $COVERAGE" >> /tmp/binh-phap-execution.log`
