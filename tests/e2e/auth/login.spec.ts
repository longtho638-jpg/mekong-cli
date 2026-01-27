import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test.describe('Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('successful login with valid credentials', async ({ page }) => {
    // Note: In a real scenario, we would seed this user first or use a fixture
    await loginPage.login('user@example.com', 'password123');

    // Check for redirection to dashboard or success state
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('login failure with invalid credentials', async ({ page }) => {
    await loginPage.login('user@example.com', 'wrongpassword');
    await loginPage.expectError('Invalid credentials');
  });

  test('login failure with empty fields', async ({ page }) => {
    await loginPage.submitButton.click();
    // Assuming HTML5 validation or UI error
    // If HTML5 validation, we might check :invalid pseudo-class or browser specific validation message
    // For this test, let's assume specific UI error or just no navigation
    await expect(page).toHaveURL(/\/login/);
  });
});
