import { test, expect } from '@playwright/test';
// Note: playwright-lighthouse usually requires a specific setup (chrome launcher),
// which might be complex in standard playwright test runner without extra config.
// For now, we'll stick to basic load time assertions which are universally supported.

test.describe('Performance', () => {
  test('homepage loads in under 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');

    // Wait for meaningful paint or specific element
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - start;
    console.log(`Homepage load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('dashboard loads in under 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - start;
    console.log(`Dashboard load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });
});
