import { test, expect, type Page, type Route } from '@playwright/test'

test.describe('Kanban Board', () => {
  // Common setup for mocked data
  const setupDefaultMocks = async (page: Page) => {
    await page.route('**/api/kanban/boards/default', async (route: Route) => {
      const json = {
        id: 'default',
        title: 'Main Board',
        columns: [
          { id: 'todo', title: 'To Do', status: 'todo', order: 0, cards: [] },
          { id: 'in_progress', title: 'In Progress', status: 'in_progress', order: 1, cards: [] },
          { id: 'review', title: 'Review', status: 'review', order: 2, cards: [] },
          { id: 'done', title: 'Done', status: 'done', order: 3, cards: [] },
        ],
      }
      await route.fulfill({ json })
    })
  }

  test('should display the Kanban board with columns', async ({ page }) => {
    await setupDefaultMocks(page)

    // Navigate after mocks are set up
    await page.goto('/en/dashboard/workflow/kanban')
    await page.waitForSelector('h3', { timeout: 10000 })

    // Check if columns exist using specific text
    await expect(page.getByRole('heading', { name: 'To Do' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'In Progress' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Review' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Done' })).toBeVisible()
  })

  test('should allow creating a new card', async ({ page }) => {
    // Mock window.prompt
    await page.addInitScript(() => {
      window.prompt = () => 'Test Task Playwright'
    })

    // Shared state for mocks
    const state = {
      cards: [] as Array<{
        id: string
        title: string
        status: string
        priority: string
        created_at: string
        updated_at: string
        order: number
        tags: string[]
      }>,
    }

    // Mock Board API (GET)
    await page.route('**/api/kanban/boards/default', async route => {
      const json = {
        id: 'default',
        title: 'Main Board',
        columns: [
          { id: 'todo', title: 'To Do', status: 'todo', order: 0, cards: [...state.cards] },
          { id: 'in_progress', title: 'In Progress', status: 'in_progress', order: 1, cards: [] },
          { id: 'review', title: 'Review', status: 'review', order: 2, cards: [] },
          { id: 'done', title: 'Done', status: 'done', order: 3, cards: [] },
        ],
      }
      await route.fulfill({ json })
    })

    // Mock API for card creation (POST)
    await page.route('**/api/kanban/boards/default/cards', async route => {
      const newCard = {
        id: 'card-new',
        title: 'Test Task Playwright',
        status: 'todo',
        priority: 'medium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        order: 0,
        tags: [],
      }
      state.cards.push(newCard)
      await route.fulfill({ json: newCard })
    })

    // Navigate after mocks
    await page.goto('/en/dashboard/workflow/kanban')
    await page.waitForSelector('h3', { timeout: 10000 })

    // Locate the "To Do" column container using regex for heading
    const todoColumn = page
      .locator('div.rounded-xl')
      .filter({ has: page.getByRole('heading', { name: /^To Do/ }) })

    // Click the button inside that column's header
    const addButton = todoColumn.locator('button[aria-label^="Add card to"]').first()

    // Setup wait for the re-fetch
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/kanban/boards/default') && response.status() === 200
    )

    await addButton.click()

    // Wait for the re-fetch to complete
    await responsePromise

    // Wait for the card to appear
    await expect(page.getByText('Test Task Playwright')).toBeVisible({ timeout: 10000 })
  })

  test('should open edit modal on clicking edit icon', async ({ page }) => {
    // Ensure a card exists first
    await page.addInitScript(() => {
      window.prompt = () => 'Task to Edit'
    })

    // Initial state with one card
    await page.route('**/api/kanban/boards/default', async route => {
      const json = {
        id: 'default',
        title: 'Main Board',
        columns: [
          {
            id: 'todo',
            title: 'To Do',
            status: 'todo',
            order: 0,
            cards: [
              {
                id: 'card-1',
                title: 'Task to Edit',
                status: 'todo',
                priority: 'medium',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                order: 0,
                tags: [],
              },
            ],
          },
          { id: 'in_progress', title: 'In Progress', status: 'in_progress', order: 1, cards: [] },
          { id: 'review', title: 'Review', status: 'review', order: 2, cards: [] },
          { id: 'done', title: 'Done', status: 'done', order: 3, cards: [] },
        ],
      }
      await route.fulfill({ json })
    })

    // Navigate after mocks
    await page.goto('/en/dashboard/workflow/kanban')
    await page.waitForSelector('h3', { timeout: 10000 })

    // Find the card container
    const cardTitle = page.getByText('Task to Edit')
    await expect(cardTitle).toBeVisible()

    // Locate the card wrapper
    const card = cardTitle.locator('xpath=../../..')

    // Find the edit button inside the card actions
    const actionsDiv = card.locator('div.flex.gap-2').first()
    const editButton = actionsDiv.locator('button').first()

    await editButton.click()

    // Check if modal opens
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Edit Card' })).toBeVisible()

    // Check form fields
    await expect(page.locator('input[value="Task to Edit"]')).toBeVisible()
  })
})
