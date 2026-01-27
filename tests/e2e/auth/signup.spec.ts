import { test, expect } from '@playwright/test';

test.describe('Signup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('successful signup with valid details', async ({ page }) => {
    await page.fill('input[name="name"]', 'New User');
    await page.fill('input[name="email"]', `newuser${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Expect redirection to onboarding or dashboard
    await expect(page).toHaveURL(/\/onboarding|\/dashboard/);
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('signup failure with existing email', async ({ page }) => {
    // Assuming 'test@example.com' exists from seed
    await page.fill('input[name="name"]', 'Existing User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Email already in use')).toBeVisible();
  });
});
