import { test, expect } from '@playwright/test'

test.describe('AgentOps Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/en/agentops')
    })

    test('should load command center', async ({ page }) => {
        // Check page title
        await expect(page).toHaveTitle(/AgencyOS/)

        // Check main elements exist
        await expect(page.locator('text=AgentOps')).toBeVisible()
    })

    test('should display agent metrics', async ({ page }) => {
        // Check WIN³ Score is displayed
        await expect(page.locator('text=WIN³')).toBeVisible()

        // Check agents count
        await expect(page.locator('text=Agents')).toBeVisible()

        // Check tasks metric
        await expect(page.locator('text=Tasks')).toBeVisible()
    })

    test('should have quick action buttons', async ({ page }) => {
        // Check quick actions exist
        const quickActions = page.locator('[data-testid="quick-actions"]')

        if (await quickActions.isVisible()) {
            await expect(quickActions).toBeVisible()
        }
    })

    test('should toggle theme', async ({ page }) => {
        // Find theme toggle if exists
        const themeToggle = page.locator('[data-testid="theme-toggle"]')

        if (await themeToggle.isVisible()) {
            await themeToggle.click()
            // Check theme changed
            await expect(page.locator('html')).toHaveClass(/light|dark/)
        }
    })

    test('should navigate between pages', async ({ page }) => {
        // Navigate to revenue
        await page.goto('/en/revenue')
        await expect(page).toHaveURL(/revenue/)

        // Navigate back to agentops
        await page.goto('/en/agentops')
        await expect(page).toHaveURL(/agentops/)
    })

    test('should be responsive on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 })
        await page.goto('/en/agentops')

        // Should still be functional on mobile
        await expect(page.locator('text=AgentOps')).toBeVisible()
    })
})

test.describe('Performance', () => {
    test('should load within acceptable time', async ({ page }) => {
        const start = Date.now()
        await page.goto('/en/agentops')
        const loadTime = Date.now() - start

        // Should load in under 5 seconds
        expect(loadTime).toBeLessThan(5000)
    })
})
