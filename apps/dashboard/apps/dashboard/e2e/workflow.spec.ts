import { test, expect } from '@playwright/test';

test.describe('Workflow Builder Flow', () => {
  test('should load workflow editor', async ({ page }) => {
    await page.goto('/dashboard/workflow');

    // Check for title
    await expect(page.getByText('Workflow Automation')).toBeVisible();

    // Check for React Flow
    // The editor usually has a class or id, but we can look for specific text or controls
    await expect(page.getByRole('button', { name: 'Run' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Workflow' })).toBeVisible();
  });
});
