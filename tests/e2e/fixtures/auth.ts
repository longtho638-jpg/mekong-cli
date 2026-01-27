import { test as base } from '@playwright/test';

type AuthFixture = {
  login: (userType?: 'user' | 'admin') => Promise<void>;
};

export const test = base.extend<AuthFixture>({
  login: async ({ page }, use) => {
    await use(async (userType = 'user') => {
      await page.goto('/login');
      // In a real app, you might use API login to bypass UI
      // await page.request.post('/api/auth/login', { ... });

      // Or UI login
      await page.fill('input[name="email"]', userType === 'admin' ? 'admin@example.com' : 'user@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/);
    });
  },
});
