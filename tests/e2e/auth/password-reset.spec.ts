import { test, expect } from '@playwright/test';

test.describe('Password Reset', () => {
  test('request password reset link', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Reset link sent')).toBeVisible();
  });

  test('reset password flow', async ({ page }) => {
    // Navigate to a valid reset link (mocked token)
    await page.goto('/reset-password?token=valid-mock-token');

    await page.fill('input[name="password"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Password updated successfully')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
