import { test, expect } from '@playwright/test';

test.describe('PayPal Checkout Flow', () => {
  test('should complete a mock checkout successfully', async ({ page }) => {
    // Intercept create-order API to return a mock order ID
    await page.route('**/payments/paypal/create-order', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ orderId: 'mock_12345' }),
      });
    });

    // Intercept capture-order API
    await page.route('**/payments/paypal/capture-order', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ transactionId: 'txn_mock_98765', status: 'COMPLETED' }),
      });
    });

    // Navigate to checkout demo page
    await page.goto('/checkout/demo');

    // Wait for the page to load
    await expect(page.getByText('Demo Thanh Toán PayPal')).toBeVisible();

    // Select a product
    await page.getByText('Vibe Starter').click();

    // Click the PayPal button
    const paypalButton = page.getByRole('button', { name: 'Thanh Toán với PayPal' });
    await expect(paypalButton).toBeVisible();
    await paypalButton.click();

    // Check for success message
    await expect(page.getByText('Thanh Toán Thành Công!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('ID: txn_mock_98765')).toBeVisible();
  });

  test('should handle payment errors', async ({ page }) => {
    // Intercept create-order API to return an error
    await page.route('**/payments/paypal/create-order', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Insufficient funds' }),
      });
    });

    await page.goto('/checkout/demo');
    
    const paypalButton = page.getByRole('button', { name: 'Thanh Toán với PayPal' });
    await paypalButton.click();

    // Check for error message
    await expect(page.getByText('Failed to create order')).toBeVisible();
  });
});
