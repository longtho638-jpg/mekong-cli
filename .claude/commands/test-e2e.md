---
description: 🧪 E2E Testing — Playwright/Cypress, Browser Automation, Full-Flow Tests
argument-hint: [test-file] [browser: chromium|firefox|webkit] [headed]
---

**Think harder** để e2e test: <test-file>$ARGUMENTS</test-file>

**IMPORTANT:** E2E tests PHẢI chạy được trên CI/CD — không hardcode paths, sử dụng environment variables.

## Test Runners

| Framework | Language | Parallel | Video | Trace | Best For |
|-----------|----------|----------|-------|-------|----------|
| **Playwright** | TS/JS/Python | ✅ | ✅ | ✅ | Modern apps, multi-browser |
| **Cypress** | TS/JS | ⚠️ Limited | ✅ | ⚠️ | Dev-first, easy setup |
| **Selenium** | Multiple | ✅ | ❌ | ❌ | Legacy, enterprise |
| **Puppeteer** | TS/JS | ❌ | ✅ | ✅ | Chrome-only, scraping |

## Playwright E2E Tests

```bash
# === Install Playwright ===
npm init playwright@latest

# Hoặc add vào project có sẵn
npm i -D @playwright/test
npx playwright install # Install browsers

# === Run All Tests ===
npx playwright test

# === Run Specific Test ===
npx playwright test tests/e2e/checkout.spec.ts

# === Run with UI Mode (Interactive) ===
npx playwright test --ui

# === Run in Headed Mode (See Browser) ===
npx playwright test --headed

# === Run Specific Browser ===
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# === Debug Mode ===
npx playwright test --debug

# === Generate Tests (Codegen) ===
npx playwright codegen https://localhost:3000

# === Show Report ===
npx playwright show-report
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'junit-results.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

```typescript
// tests/e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to cart before each test
    await page.goto('/cart');
  });

  test('should complete checkout successfully', async ({ page }) => {
    // Step 1: Add item to cart
    await page.goto('/products/subscription-pro');
    await page.click('[data-testid="add-to-cart"]');

    // Verify cart count updated
    await expect(page.locator('[data-testid="cart-count"]'))
      .toHaveText('1');

    // Step 2: Navigate to checkout
    await page.click('[data-testid="checkout-button"]');
    await expect(page).toHaveURL('/checkout');

    // Step 3: Fill checkout form
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="cardNumber"]', '4242424242424242');
    await page.fill('[name="expiry"]', '12/25');
    await page.fill('[name="cvc"]', '123');

    // Step 4: Submit order
    await page.click('[data-testid="pay-button"]');

    // Step 5: Verify success
    await expect(page.locator('[data-testid="order-confirmation"]'))
      .toBeVisible({ timeout: 10000 });

    // Verify order ID present
    const orderId = await page.locator('[data-testid="order-id"]').textContent();
    expect(orderId).toMatch(/^ORD-\d+$/);
  });

  test('should show error for invalid card', async ({ page }) => {
    await page.goto('/checkout');

    // Fill invalid card number
    await page.fill('[name="cardNumber"]', '1234567890123456');
    await page.fill('[name="expiry"]', '12/25');
    await page.fill('[name="cvc"]', '123');

    await page.click('[data-testid="pay-button"]');

    // Verify error message
    await expect(page.locator('[data-testid="card-error"]'))
      .toHaveText('Invalid card number');
  });

  test('should persist cart across sessions', async ({ page, context }) => {
    // Add to cart
    await page.goto('/products/subscription-pro');
    await page.click('[data-testid="add-to-cart"]');

    // Get localStorage state
    const storage = await context.storageState();

    // Open new page with same storage
    const newPage = await context.newPage();
    await newPage.goto('/');

    // Verify cart persists
    await expect(newPage.locator('[data-testid="cart-count"]'))
      .toHaveText('1');
  });
});
```

```typescript
// tests/e2e/auth.setup.ts
import { test as setup } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');

  await page.fill('[name="email"]', 'testuser@example.com');
  await page.fill('[name="password"]', 'TestPassword123!');
  await page.click('[type="submit"]');

  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

  await page.context().storageState({ path: authFile });
});
```

```typescript
// tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

test('should access protected page when authenticated', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toHaveText('Dashboard');
});
```

## Cypress E2E Tests

```bash
# === Install Cypress ===
npm install -D cypress

# === Open Cypress UI ===
npx cypress open

# === Run Headless ===
npx cypress run

# === Run with Specific Browser ===
npx cypress run --browser chrome
npx cypress run --browser electron
npx cypress run --browser firefox

# === Run Specific Spec ===
npx cypress run --spec "cypress/e2e/checkout.cy.ts"

# === Run in Groups (Parallel) ===
npx cypress run --record --parallel --group "Chrome"
```

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    supportFile: 'cypress/support/e2e.ts',
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    env: {
      apiUrl: 'http://localhost:3000/api',
    },
  },
});
```

```typescript
// cypress/e2e/checkout.cy.ts
describe('Checkout Flow', () => {
  beforeEach(() => {
    cy.visit('/cart');
  });

  it('should complete purchase successfully', () => {
    // Add item to cart
    cy.visit('/products/subscription-pro');
    cy.getByTestId('add-to-cart').click();

    // Navigate to checkout
    cy.getByTestId('checkout-button').click();
    cy.url().should('include', '/checkout');

    // Fill payment details
    cy.get('[name="email"]').type('test@example.com');
    cy.get('[name="cardNumber"]').type('4242424242424242');
    cy.get('[name="expiry"]').type('12/25');
    cy.get('[name="cvc"]').type('123');

    // Submit
    cy.getByTestId('pay-button').click();

    // Verify success
    cy.getByTestId('order-confirmation').should('be.visible');
    cy.getByTestId('order-id').should('match', /ORD-\d+/);
  });

  it('should validate required fields', () => {
    cy.visit('/checkout');

    // Try to submit without filling
    cy.getByTestId('pay-button').click();

    // Verify validation errors
    cy.get('[name="email"]').parent()
      .should('have.class', 'error');
  });
});

// Custom commands
Cypress.Commands.add('getByTestId', (selector: string) => {
  return cy.get(`[data-testid="${selector}"]`);
});
```

## Visual Regression Testing

```typescript
// tests/e2e/visual.spec.ts
import { test, expect } from '@playwright/test';

test('homepage should match screenshot', async ({ page }) => {
  await page.goto('/');

  // Full page screenshot
  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    maxDiffPixels: 100, // Allow small differences
  });
});

test('pricing page should be responsive', async ({ page }) => {
  // Desktop view
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/pricing');
  await expect(page).toHaveScreenshot('pricing-desktop.png');

  // Tablet view
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page).toHaveScreenshot('pricing-tablet.png');

  // Mobile view
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page).toHaveScreenshot('pricing-mobile.png');
});
```

## API Testing

```typescript
// tests/e2e/api.spec.ts
import { test, expect } from '@playwright/test';

test('should create subscription via API', async ({ request }) => {
  const response = await request.post('/api/subscriptions', {
    data: {
      plan: 'pro',
      quantity: 1,
    },
    headers: {
      'Authorization': `Bearer ${process.env.API_TOKEN}`,
    },
  });

  expect(response.status()).toBe(201);

  const body = await response.json();
  expect(body).toMatchObject({
    id: expect.stringMatching(/^sub_/),
    status: 'active',
  });
});
```

## CI/CD Integration

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm ci

    - name: Install Playwright browsers
      run: npx playwright install --with-deps

    - name: Build application
      run: npm run build

    - name: Run Playwright tests
      run: npx playwright test
      env:
        BASE_URL: http://localhost:3000

    - uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30

    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: test-results
        path: test-results/
```

## Test Data Management

```typescript
// tests/e2e/fixtures/test-data.ts
export const testData = {
  user: {
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User',
  },
  card: {
    number: '4242424242424242',
    expiry: '12/25',
    cvc: '123',
  },
  product: {
    id: 'prod_subscription_pro',
    name: 'Subscription Pro',
    price: 9900,
  },
};
```

## Performance Assertions

```typescript
// tests/e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test('homepage should load within 3s', async ({ page }) => {
  const start = Date.now();
  await page.goto('/');
  const loadTime = Date.now() - start;

  expect(loadTime).toBeLessThan(3000);

  // Check Core Web Vitals
  const metrics = await page.evaluate(() => {
    return new Promise<PerformanceMetrics>((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        resolve({
          lcp: entries.find(e => e.entryType === 'largest-contentful-paint')?.startTime || 0,
          fid: entries.find(e => e.entryType === 'first-input')?.duration || 0,
          cls: entries.filter(e => e.entryType === 'layout-shift')
            .reduce((sum, e) => sum + (e as any).value, 0),
        });
      }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    });
  });

  expect(metrics.lcp).toBeLessThan(2500);
  expect(metrics.fid).toBeLessThan(100);
  expect(metrics.cls).toBeLessThan(0.1);
});
```

## Related Commands

- `/test` — Unit & integration tests
- `/test:ui` — UI component tests
- `/health-check` — System health monitoring
- `/monitor` — Metrics & APM dashboard
- `/deploy` — Deployment orchestration
