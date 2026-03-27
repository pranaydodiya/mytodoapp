import { expect, test } from '@playwright/test'

test.describe('todo API failure', () => {
  test('shows server error when create fails', async ({ page }) => {
    await page.route('**/api/todos', async route => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Simulated create failure', code: 'TEST' }),
      })
    })

    await page.goto('/')

    await page.getByTestId('task-title-input').fill('Should not persist')
    await page.getByTestId('add-task-button').click()

    await expect(page.getByTestId('error-banner')).toContainText('Simulated create failure')
    await expect(page.getByTestId('task-list').getByText('Should not persist')).toHaveCount(0)
  })
})
