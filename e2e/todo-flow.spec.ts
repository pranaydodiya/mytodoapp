import { expect, test } from '@playwright/test'

test.describe('todo happy path', () => {
  test('create, complete, filter active, search', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()
    await expect(page.getByTestId('task-title-input')).toBeVisible()

    const title = `E2E task ${Date.now()}`
    await page.getByTestId('task-title-input').fill(title)
    await page.getByTestId('add-task-button').click()

    await expect(page.getByTestId('task-list').getByText(title)).toBeVisible()

    await page.getByRole('button', { name: new RegExp(title) }).click()
    await expect(
      page.getByTestId('task-list').getByText(title),
    ).toHaveClass(/line-through/)

    await page.getByRole('button', { name: 'Active' }).click()
    await expect(page.getByTestId('task-list').getByText(title)).toHaveCount(0)

    await page.getByRole('button', { name: 'All' }).click()
    await expect(page.getByTestId('task-list').getByText(title)).toBeVisible()

    const searchResponse = page.waitForResponse(
      res =>
        res.request().method() === 'GET' &&
        res.url().includes('/api/todos') &&
        new URL(res.url()).searchParams.has('search'),
    )
    await page.getByTestId('task-search-input').fill(title.slice(0, 12))
    await searchResponse
    await expect(page.getByTestId('task-list').getByText(title)).toBeVisible()
  })
})
