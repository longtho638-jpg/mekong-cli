import { test, expect } from '@playwright/test';

test.describe('Subscription Flow', () => {
  test('subscription page loads with plan comparison', async ({ page }) => {
    await page.goto('/dashboard/subscription');

    // Check page title
    await expect(page.getByText('Manage Subscription')).toBeVisible();

    // Check Free plan card
    await expect(page.getByText('Free')).toBeVisible();
    await expect(page.getByText('$0')).toBeVisible();

    // Check Pro plan card
    await expect(page.getByText('Pro')).toBeVisible();
    await expect(page.getByText('$49')).toBeVisible();

    // Check Enterprise plan card
    await expect(page.getByText('Enterprise')).toBeVisible();
    await expect(page.getByText('$199')).toBeVisible();
  });

  test('displays current plan badge', async ({ page }) => {
    await page.goto('/dashboard');

    // Check subscription badge in header
    await expect(page.getByText('Current Plan')).toBeVisible();
    await expect(page.getByText('Free Plan')).toBeVisible();
  });

  test('shows upgrade button on dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Check upgrade button
    const upgradeButton = page.getByRole('button', { name: /upgrade/i });
    await expect(upgradeButton).toBeVisible();
    await expect(upgradeButton).toBeEnabled();
  });

  test('upgrade button navigates to subscription page', async ({ page }) => {
    await page.goto('/dashboard');

    const upgradeButton = page.getByRole('button', { name: /upgrade/i });
    await upgradeButton.click();

    // Should navigate to subscription page
    await expect(page).toHaveURL('/dashboard/subscription');
    await expect(page.getByText('Manage Subscription')).toBeVisible();
  });

  test('manage subscription button present', async ({ page }) => {
    await page.goto('/dashboard/subscription');

    // Check manage subscription button
    const manageButton = page.getByRole('button', { name: /manage/i });
    await expect(manageButton).toBeVisible();
    await expect(manageButton).toBeEnabled();
  });

  test('plan features are listed', async ({ page }) => {
    await page.goto('/dashboard/subscription');

    // Check Pro features
    await expect(page.getByText('Everything in Free')).toBeVisible();
    await expect(page.getByText('Unlimited missions')).toBeVisible();
    await expect(page.getByText('Priority support')).toBeVisible();

    // Check Enterprise features
    await expect(page.getByText('Everything in Pro')).toBeVisible();
    await expect(page.getByText('Custom integrations')).toBeVisible();
    await expect(page.getByText('Dedicated support')).toBeVisible();
  });

  test('sidebar has Subscription nav item', async ({ page }) => {
    await page.goto('/dashboard');

    // Check sidebar navigation
    const subscriptionLink = page.getByRole('link', { name: /subscription/i });
    await expect(subscriptionLink).toBeVisible();
    await expect(subscriptionLink).toHaveAttribute('href', '/dashboard/subscription');
  });
});
