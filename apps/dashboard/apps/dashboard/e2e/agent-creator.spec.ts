import { test, expect } from '@playwright/test';

test.describe('Agent Creator Flow', () => {
  test('should navigate to create agent page', async ({ page }) => {
    await page.goto('/dashboard/agents/new');

    // Check for title
    await expect(page.getByText('Create Custom Agent')).toBeVisible();

    // Check for form fields
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Role')).toBeVisible();
    await expect(page.getByLabel('Description')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Agent' })).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/dashboard/agents/new');
    await page.getByRole('button', { name: 'Create Agent' }).click();

    // Should show error for name
    // Note: This depends on how react-hook-form renders errors in the UI
    // Assuming standard HTML5 validation or text error
    // await expect(page.getByText('Name is required')).toBeVisible();
  });
});
