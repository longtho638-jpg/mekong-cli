/**
 * Playwright Configuration for RaaS Gateway and AgencyOS Dashboard E2E Tests
 *
 * Features:
 * - Parallel test execution
 * - Multiple browser support (Chromium, Firefox, WebKit)
 * - Screenshot on failure
 * - Video recording for debugging
 * - CI/CD integration with GitHub Actions
 *
 * Usage:
 * ```bash
 * # Run all tests
 * npx playwright test
 *
 * # Run specific test file
 * npx playwright test tests/e2e/raas-gateway-e2e-integration.test.ts
 *
 * # Run with UI
 * npx playwright test --ui
 *
 * # Run in specific browser
 * npx playwright test --project=chromium
 *
 * # Run in CI mode
 * npx playwright test --reporter=list
 * ```
 *
 * @see https://playwright.dev
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

  // Timeout per test
  timeout: 30 * 1000,

  // Timeout for expect assertions
  expect: {
    timeout: 5000,
  },

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list', { printSteps: true }],
    ['json', { outputFile: 'playwright-results.json' }],
    // JUnit reporter for CI/CD
    ['junit', { outputFile: 'playwright-junit.xml' }],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL for dashboard tests
    baseURL: process.env.TEST_DASHBOARD_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Browser context options
    viewport: { width: 1280, height: 720 },

    // Actionability options
    actionTimeout: 10000,

    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Test against mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Test against branded browsers
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: process.env.CI
    ? {
        // In CI, expect servers to be running
        // Just verify they're healthy
        command: 'echo "Servers should be running in CI"',
        url: process.env.TEST_DASHBOARD_URL,
        timeout: 10000,
        reuseExistingServer: true,
      }
    : undefined,

  // Output directory for artifacts
  outputDir: 'playwright-artifacts',

  // Global setup hook
  globalSetup: require.resolve('./tests/e2e/global-setup'),

  // Global teardown hook
  globalTeardown: require.resolve('./tests/e2e/global-teardown'),
});
