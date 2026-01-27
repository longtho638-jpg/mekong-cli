import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Simulate a user who has just signed up but not onboarded
    // This might require a specific login fixture state or direct URL with auth token
    await page.goto('/onboarding');
  });

  test('complete onboarding steps', async ({ page }) => {
    // Step 1: Profile setup
    await expect(page.locator('text=Setup Profile')).toBeVisible();
    await page.fill('input[name="company"]', 'Acme Corp');
    await page.selectOption('select[name="role"]', 'Developer');
    await page.click('button:has-text("Next")');

    // Step 2: Preferences
    await expect(page.locator('text=Preferences')).toBeVisible();
    await page.check('input[name="newsletter"]');
    await page.click('button:has-text("Finish")');

    // Completion
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Welcome to your dashboard')).toBeVisible();
  });
});
