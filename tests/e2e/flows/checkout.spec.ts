import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('complete checkout flow', async ({ page }) => {
    // 1. Add to cart
    // Navigate to a product page. Assuming ID 1 exists.
    await page.goto('/products/1');
    await page.click('button:has-text("Add to Cart")');

    // 2. View cart
    await page.click('[aria-label="Cart"]');
    await expect(page.locator('text=1 item')).toBeVisible();

    // 3. Checkout
    await page.click('button:has-text("Checkout")');

    // Fill shipping/payment details
    // Note: These selectors are hypothetical based on common patterns
    await page.fill('input[name="email"]', 'checkout@example.com');
    await page.fill('input[name="name"]', 'Test Buyer');
    await page.fill('input[name="address"]', '123 Test St');

    // Payment (Mock)
    await page.fill('input[name="card_number"]', '4242424242424242');
    await page.fill('input[name="expiry"]', '12/25');
    await page.fill('input[name="cvc"]', '123');

    await page.click('button:has-text("Pay Now")');

    // 4. Confirmation
    await expect(page.locator('text=Order confirmed')).toBeVisible();
    await expect(page).toHaveURL(/\/order-confirmed/);
  });
});
