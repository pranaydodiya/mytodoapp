import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

const DATABASE_URL = 'file:./prisma/e2e.db'
/** Dedicated port so E2E never attaches to an unrelated app on :3000. */
const E2E_PORT = 3105
const E2E_ORIGIN = `http://127.0.0.1:${E2E_PORT}`

export default defineConfig({
  testDir: path.join(__dirname, 'e2e'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  globalSetup: path.join(__dirname, 'e2e', 'global-setup.mjs'),
  use: {
    baseURL: E2E_ORIGIN,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx next dev --port ${E2E_PORT}`,
    url: E2E_ORIGIN,
    reuseExistingServer: !!process.env.PW_REUSE_E2E_SERVER,
    timeout: 120_000,
    env: {
      ...process.env,
      DATABASE_URL,
    },
  },
})
