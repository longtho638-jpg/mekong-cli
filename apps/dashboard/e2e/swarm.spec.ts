import { test, expect } from '@playwright/test';

test.describe('Swarm Visualizer', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Swarm Status API
    await page.route('**/api/swarm/v2/status', async route => {
      const json = {
        running: true,
        agents: [
          { id: 'agent-1', name: 'Architect', role: 'architect', is_busy: false, tasks_completed: 5, tasks_failed: 0, specialties: [] },
          { id: 'agent-2', name: 'Coder', role: 'coder', is_busy: true, tasks_completed: 12, tasks_failed: 1, specialties: [] },
          { id: 'agent-3', name: 'Reviewer', role: 'reviewer', is_busy: false, tasks_completed: 8, tasks_failed: 0, specialties: [] }
        ],
        metrics: {
          total_tasks: 25,
          completed_tasks: 20,
          failed_tasks: 1,
          busy_agents: 1,
          idle_agents: 2,
          pending_tasks: 4
        }
      };
      await route.fulfill({ json });
    });

    // Mock Swarm Tasks API
    await page.route('**/api/swarm/v2/tasks', async route => {
      const json = [
        { id: 'task-1', name: 'Build Login', status: 'running', priority: 1, assigned_agent: 'agent-2', created_at: Date.now(), completed_at: null }
      ];
      await route.fulfill({ json });
    });

    // Navigate to the Swarm page
    await page.goto('/en/dashboard/swarm');

    // Wait for the network to be idle to ensure API calls have happened
    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch (e) {
      // Ignore timeout if network never idles (e.g. websocket/polling)
      console.log('Network idle timeout, continuing...');
    }
  });

  test('should display the Swarm Intelligence dashboard', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Swarm Intelligence' })).toBeVisible({ timeout: 10000 });
  });

  test('should show agent status', async ({ page }) => {
    // Check for mocked agents in the visualizer graph
    // React Flow renders text in nodes. Use first() to avoid strict mode violations if text appears multiple times
    await expect(page.getByText('Architect').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Coder').first()).toBeVisible();
    await expect(page.getByText('Reviewer').first()).toBeVisible();
  });

  test('visualizer graph should be present', async ({ page }) => {
    // The React Flow component
    // Check for the main wrapper
    const wrapper = page.locator('.react-flow');
    await expect(wrapper).toBeVisible({ timeout: 15000 });

    // Check for the central Hub node
    // Use first() to avoid strict mode violations if multiple elements match text
    await expect(page.getByText('Swarm Orchestrator').first()).toBeVisible({ timeout: 15000 });
  });
});
