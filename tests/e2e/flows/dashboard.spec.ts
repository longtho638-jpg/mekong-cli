import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('Dashboard interactions', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    // Assuming we have a global setup or fixture handling auth,
    // or we manually log in here. For now, assuming direct access for structure.
    await dashboardPage.goto();
  });

  test('displays critical metrics', async ({ page }) => {
    await expect(page.locator('[data-testid="stat-card-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-card-revenue"]')).toBeVisible();
  });

  test('can navigate to settings', async ({ page }) => {
    await page.click('[aria-label="Settings"]');
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
  });

  test('can logout', async ({ page }) => {
    await page.click('[aria-label="User menu"]');
    await page.click('text=Logout');
    await expect(page).toHaveURL(/\/login/);
  });
});
