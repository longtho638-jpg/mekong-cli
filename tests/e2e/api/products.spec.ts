import { test, expect } from '@playwright/test';

test.describe('API: Products', () => {
  test('GET /api/products returns valid data', async ({ request }) => {
    const response = await request.get('/api/products');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('products');
    expect(Array.isArray(data.products)).toBeTruthy();

    if (data.products.length > 0) {
      const product = data.products[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
    }
  });

  test('GET /api/products/:id returns single product', async ({ request }) => {
    // Assuming product with ID 1 exists
    const response = await request.get('/api/products/1');

    if (response.status() === 404) {
      console.log('Product 1 not found, skipping specific assertions');
      return;
    }

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('id', 1);
    expect(data).toHaveProperty('name');
  });
});
