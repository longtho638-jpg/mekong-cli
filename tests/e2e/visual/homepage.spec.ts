import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('homepage visual regression', async ({ page }) => {
    await page.goto('/');

    // Wait for critical elements to load to avoid flakiness
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('homepage.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('dashboard visual regression', async ({ page }) => {
    // Mock login state or use a specialized setup if needed
    // For now, assuming we can reach dashboard or redirect to login
    // If redirect to login, it snapshots the login page, which is also useful
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('dashboard.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });
});
