import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly revenueChart: Locator;
  readonly userMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeMessage = page.locator('text=Welcome back');
    this.revenueChart = page.locator('[data-testid="revenue-chart"]');
    this.userMenu = page.locator('[aria-label="User menu"]');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async expectLoaded() {
    await expect(this.welcomeMessage).toBeVisible();
    await expect(this.revenueChart).toBeVisible();
  }
}
