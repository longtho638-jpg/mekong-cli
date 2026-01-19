# Phase 10: Testing & Quality Gates

**Timeline:** Phase 10 (Week 4)
**Impact:** Quality assurance + go-live confidence
**Priority:** P0

---

## 📋 CONTEXT

**Parent Plan:** `/Users/macbookprom1/mekong-cli/plans/260117-0029-refactor-for-golive/plan.md`
**Dependencies:** Phases 1-9 (all refactoring complete)
**Related Docs:** `docs/code-standards.md`, `.github/workflows/ci.yml`

---

## 🎯 OVERVIEW

**Date:** 2026-01-19
**Description:** Achieve >80% test coverage, implement regression suite, set up Lighthouse CI, optimize bundle size <1MB
**Priority:** P0 (go-live gate)
**Status:** Pending

---

## 🔑 KEY INSIGHTS

From research reports:

1. **Current Coverage Unknown**: No baseline test coverage metrics
2. **Bundle Size**: 1.5MB current → <1MB target (30% reduction needed)
3. **Performance Score**: Lighthouse ~65 → 90+ target
4. **Security Gaps**: Webhook verification, admin auth, subprocess sanitization
5. **Regression Risk**: 67 TODO/FIXME items fixed without safety net

---

## 📊 REQUIREMENTS

### Deliverables

1. **Test Coverage >80%**
   - Unit tests: All critical business logic
   - Integration tests: API endpoints, webhooks
   - E2E tests: Critical user flows

2. **Regression Test Suite**
   - Payment processing scenarios
   - Subscription lifecycle
   - Webhook handling
   - Authentication flows

3. **Lighthouse CI**
   - Performance: >90
   - Accessibility: >95
   - Best Practices: >95
   - SEO: >90

4. **Bundle Size Optimization**
   - Frontend: <800KB (gzipped)
   - Backend: N/A (server-side)
   - Total reduction: 30-40%

---

## 🏗️ ARCHITECTURE

### Testing Infrastructure
```
tests/
├── unit/                    # Fast, isolated tests
│   ├── core/
│   │   ├── test_control.py
│   │   ├── test_knowledge_graph.py
│   │   └── test_money_maker.py
│   ├── cli/
│   │   └── test_commands.py
│   └── backend/
│       └── test_api.py
├── integration/             # Cross-module tests
│   ├── test_payment_flow.py
│   ├── test_subscription_lifecycle.py
│   └── test_webhook_handling.py
├── e2e/                     # Full user flows
│   ├── test_signup_to_payment.py
│   ├── test_project_creation.py
│   └── test_dashboard_usage.py
├── performance/             # Load testing
│   └── test_api_performance.py
├── security/                # Security tests
│   ├── test_webhook_verification.py
│   ├── test_input_validation.py
│   └── test_auth.py
└── fixtures/                # Shared test data
    ├── webhooks.json
    ├── users.json
    └── projects.json

.github/workflows/
├── test.yml                 # Run tests on PR
├── lighthouse.yml           # Lighthouse CI
└── bundle-size.yml          # Bundle size monitoring
```

---

## 📂 RELATED CODE FILES

| Component | Current Coverage | Target | Priority |
|-----------|------------------|--------|----------|
| `core/control_enhanced.py` | 0% | 90% | **P0** |
| `core/money_maker.py` | 0% | 95% | **P0** |
| `backend/api/routers/webhooks.py` | 0% | 100% | **P0** |
| `apps/dashboard/lib/billing/` | 0% | 85% | **P0** |
| `cli/commands/ops.py` | 0% | 70% | **P1** |
| Frontend components | Unknown | 80% | **P1** |

---

## 🛠️ IMPLEMENTATION STEPS

### Step 1: Establish Testing Infrastructure (8h)

**1.1 Set up pytest + coverage**
```bash
# Install dependencies
pnpm add -D pytest pytest-cov pytest-asyncio pytest-mock

# Configure pytest
cat > pytest.ini << EOF
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
asyncio_mode = auto
addopts =
    --cov=antigravity
    --cov=backend
    --cov=cli
    --cov-report=html
    --cov-report=term
    --cov-fail-under=80
EOF
```

**1.2 Set up frontend testing**
```bash
# Install dependencies
pnpm add -D vitest @testing-library/react @testing-library/user-event jsdom

# Configure vitest
cat > vitest.config.ts << EOF
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  }
})
EOF
```

**1.3 Set up E2E testing**
```bash
# Install Playwright
pnpm add -D @playwright/test

# Configure Playwright
cat > playwright.config.ts << EOF
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
EOF
```

### Step 2: Write Critical Unit Tests (16h)

**2.1 Core business logic tests**
```python
# tests/unit/core/test_money_maker.py
import pytest
from decimal import Decimal
from core.finance.money_maker import MoneyMaker
from core.finance.validators import PricingInput

@pytest.fixture
def money_maker():
    return MoneyMaker("core/config/pricing.yaml")

def test_calculate_revenue_basic(money_maker):
    """Test basic revenue calculation"""
    input_data = PricingInput(
        base_price=Decimal("100.00"),
        discount_percentage=10,
        quantity=5
    )

    result = money_maker.calculate_revenue(input_data)

    assert result.gross_revenue == Decimal("500.00")
    assert result.net_revenue > 0
    assert result.tax_amount > 0

def test_calculate_revenue_validation():
    """Test input validation"""
    with pytest.raises(ValueError):
        PricingInput(
            base_price=Decimal("-100.00"),  # Negative price
            discount_percentage=10,
            quantity=5
        )

def test_calculate_revenue_precision():
    """Test price precision validation"""
    with pytest.raises(ValueError):
        PricingInput(
            base_price=Decimal("100.123"),  # 3 decimal places
            discount_percentage=10,
            quantity=5
        )
```

**2.2 Control logic tests**
```python
# tests/unit/core/test_control.py
import pytest
from core.control.circuit_breaker import CircuitBreaker, CircuitState

def test_circuit_breaker_normal_operation():
    """Test circuit breaker in CLOSED state"""
    cb = CircuitBreaker(failure_threshold=3)

    def success_func():
        return "success"

    result = cb.call(success_func)
    assert result == "success"
    assert cb.state == CircuitState.CLOSED

def test_circuit_breaker_opens_after_failures():
    """Test circuit breaker opens after threshold"""
    cb = CircuitBreaker(failure_threshold=3)

    def failing_func():
        raise ValueError("Test failure")

    # Trigger failures
    for _ in range(3):
        with pytest.raises(ValueError):
            cb.call(failing_func)

    # Circuit should be OPEN
    assert cb.state == CircuitState.OPEN

    # Subsequent calls should fail fast
    with pytest.raises(Exception, match="Circuit breaker is OPEN"):
        cb.call(failing_func)
```

**2.3 API tests**
```python
# tests/unit/backend/test_webhooks.py
import pytest
from fastapi.testclient import TestClient
from backend.api.main import app

client = TestClient(app)

def test_webhook_requires_signature():
    """Test webhook rejects requests without signature"""
    response = client.post(
        "/webhook/polar",
        json={"event": "charge.succeeded"}
    )

    assert response.status_code == 401

def test_webhook_rejects_invalid_signature():
    """Test webhook rejects invalid signatures"""
    response = client.post(
        "/webhook/polar",
        json={"event": "charge.succeeded"},
        headers={"X-Polar-Signature": "invalid"}
    )

    assert response.status_code == 401

@pytest.mark.asyncio
async def test_webhook_processes_valid_request():
    """Test webhook processes valid signed request"""
    # Generate valid signature
    payload = {"event": "charge.succeeded", "data": {...}}
    signature = generate_test_signature(payload)

    response = client.post(
        "/webhook/polar",
        json=payload,
        headers={"X-Polar-Signature": signature}
    )

    assert response.status_code == 200
```

### Step 3: Write Integration Tests (12h)

**3.1 Payment flow tests**
```python
# tests/integration/test_payment_flow.py
import pytest
from decimal import Decimal

@pytest.mark.integration
async def test_complete_payment_flow(test_db):
    """Test end-to-end payment processing"""

    # 1. Create user
    user = await create_test_user()

    # 2. Create subscription
    subscription = await create_subscription(user.id, plan="pro")

    # 3. Simulate webhook
    webhook_payload = {
        "event": "charge.succeeded",
        "data": {
            "user_id": user.id,
            "amount": Decimal("49.00")
        }
    }

    # 4. Process webhook
    await process_webhook(webhook_payload)

    # 5. Verify subscription activated
    updated_subscription = await get_subscription(user.id)
    assert updated_subscription.status == "active"

    # 6. Verify usage limits applied
    limits = await get_usage_limits(user.id)
    assert limits.api_requests == 1000
    assert limits.storage == "10GB"
```

**3.2 Subscription lifecycle tests**
```python
# tests/integration/test_subscription_lifecycle.py
@pytest.mark.integration
async def test_subscription_lifecycle(test_db):
    """Test complete subscription lifecycle"""

    user = await create_test_user()

    # Create → Active
    sub = await create_subscription(user.id, plan="pro")
    await activate_subscription(sub.id)
    assert sub.status == "active"

    # Active → Cancelled
    await cancel_subscription(sub.id)
    assert sub.status == "cancelled"
    assert sub.ends_at is not None

    # Cancelled → Expired
    await expire_subscription(sub.id)
    assert sub.status == "expired"

    # Verify usage limits reverted to free
    limits = await get_usage_limits(user.id)
    assert limits.api_requests == 100  # Free tier
```

### Step 4: Write E2E Tests (8h)

**4.1 Critical user flows**
```typescript
// tests/e2e/test_signup_to_payment.spec.ts
import { test, expect } from '@playwright/test'

test('complete signup to payment flow', async ({ page }) => {
  // 1. Sign up
  await page.goto('/signup')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'SecurePassword123!')
  await page.click('button[type="submit"]')

  // 2. Verify email (mock)
  await page.goto('/verify?token=mock-token')

  // 3. Choose plan
  await page.goto('/pricing')
  await page.click('button[data-plan="pro"]')

  // 4. Enter payment info
  await page.fill('input[name="card_number"]', '4242424242424242')
  await page.fill('input[name="exp"]', '12/25')
  await page.fill('input[name="cvc"]', '123')
  await page.click('button[type="submit"]')

  // 5. Verify success
  await expect(page.locator('text=Payment successful')).toBeVisible()

  // 6. Verify dashboard access
  await page.goto('/dashboard')
  await expect(page.locator('text=Pro Plan')).toBeVisible()
})
```

**4.2 Dashboard usage test**
```typescript
// tests/e2e/test_dashboard_usage.spec.ts
test('dashboard project creation flow', async ({ page }) => {
  // Login as existing user
  await login(page, 'test@example.com', 'password')

  // Navigate to projects
  await page.goto('/dashboard/projects')

  // Create project
  await page.click('button:has-text("New Project")')
  await page.fill('input[name="name"]', 'Test Project')
  await page.fill('textarea[name="description"]', 'E2E test project')
  await page.click('button[type="submit"]')

  // Verify project created
  await expect(page.locator('text=Test Project')).toBeVisible()

  // Add task to project
  await page.click('button:has-text("Add Task")')
  await page.fill('input[name="title"]', 'Test Task')
  await page.click('button[type="submit"]')

  // Verify task appears
  await expect(page.locator('text=Test Task')).toBeVisible()
})
```

### Step 5: Set up Lighthouse CI (6h)

**5.1 Configure Lighthouse**
```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/pricing'
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.9 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
}
```

**5.2 GitHub Actions workflow**
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install dependencies
        run: pnpm install

      - name: Build app
        run: pnpm build

      - name: Run Lighthouse CI
        run: |
          pnpm lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: lighthouse-results
          path: .lighthouseci
```

### Step 6: Bundle Size Optimization (8h)

**6.1 Analyze current bundle**
```bash
# Install analyzer
pnpm add -D rollup-plugin-visualizer

# Generate bundle report
pnpm build --analyze
```

**6.2 Optimize imports**
```typescript
// Before (BAD - imports entire library)
import * as Icons from 'lucide-react'

// After (GOOD - tree-shaking friendly)
import { ChevronRight, User, Settings } from 'lucide-react'
```

**6.3 Code splitting**
```typescript
// Before (loaded upfront)
import ProjectTasks from './pages/ProjectTasks'

// After (lazy loaded)
const ProjectTasks = lazy(() => import('./pages/ProjectTasks'))
```

**6.4 Bundle size monitoring**
```yaml
# .github/workflows/bundle-size.yml
name: Bundle Size

on:
  pull_request:
    branches: [main]

jobs:
  size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Check bundle size
        uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          limit: '800 KB'
```

---

## ✅ TODO

- [ ] Set up testing infrastructure (pytest, vitest, playwright) (8h)
- [ ] Write unit tests for critical business logic (16h)
- [ ] Write integration tests for payment flows (12h)
- [ ] Write E2E tests for user journeys (8h)
- [ ] Configure Lighthouse CI (6h)
- [ ] Optimize bundle size <1MB (8h)
- [ ] Set up CI/CD quality gates (4h)
- [ ] Security testing (penetration tests, OWASP) (8h)

**Total:** 70 hours (Week 4 + ongoing)

---

## 📊 SUCCESS CRITERIA

### Test Coverage
- ✅ Overall: >80%
- ✅ Core business logic: >90%
- ✅ Payment processing: 100%
- ✅ API endpoints: >85%

### Performance
- ✅ Lighthouse Performance: >90
- ✅ Lighthouse Accessibility: >95
- ✅ Lighthouse Best Practices: >95
- ✅ Bundle size: <800KB (gzipped)

### Quality Gates (CI)
- ✅ All tests pass
- ✅ Coverage thresholds met
- ✅ No critical security vulnerabilities
- ✅ Bundle size within limits
- ✅ Lighthouse scores passing

### Regression Prevention
- ✅ Payment webhook tests: 100% coverage
- ✅ Subscription lifecycle: Full coverage
- ✅ Auth flows: Protected by tests
- ✅ Critical user journeys: E2E coverage

---

## ⚠️ RISK ASSESSMENT

**High Risk:** False confidence from insufficient test coverage
**Mitigation:** Focus on critical paths first, use mutation testing

**Medium Risk:** Flaky E2E tests
**Mitigation:** Retry logic, mock external services, use test fixtures

**Low Risk:** Performance regression not caught
**Mitigation:** Lighthouse CI on every PR

---

## 🔒 SECURITY TESTING

**Security Test Checklist:**
- [ ] Webhook signature verification (penetration test)
- [ ] SQL injection attempts (automated scanner)
- [ ] XSS payload testing (manual + automated)
- [ ] CSRF protection validation
- [ ] Rate limiting enforcement
- [ ] Authentication bypass attempts
- [ ] Authorization escalation tests
- [ ] Secrets scanning (no hardcoded keys)

**Tools:**
- OWASP ZAP for automated scanning
- Burp Suite for manual testing
- npm audit / pnpm audit for dependencies
- Trivy for container scanning

---

## 🚀 NEXT STEPS

**Week 4 Day 1-2:** Infrastructure + Unit Tests (24h)
**Week 4 Day 3-4:** Integration + E2E Tests (20h)
**Week 4 Day 5:** Lighthouse CI + Bundle Optimization (14h)
**Ongoing:** Security testing + monitoring (12h)

**Go-Live Gate:** All tests green, coverage >80%, Lighthouse >90, bundle <1MB

---

_Phase 10: Quality assurance foundation for confident go-live_
