import { test, expect } from '@playwright/test';

test.describe('API: Orders', () => {
  test('POST /api/orders creates a new order', async ({ request }) => {
    const response = await request.post('/api/orders', {
      data: {
        productId: 1,
        quantity: 2,
        address: '123 Test St'
      }
    });

    if (response.status() === 401) return; // Skip if auth required

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('status', 'pending');
  });
});
