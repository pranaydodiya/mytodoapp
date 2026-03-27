import { execFileSync } from 'node:child_process'
import { existsSync, unlinkSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createRequire } from 'node:module'

function prismaCliPath(): string {
  const require = createRequire(import.meta.url)
  const prismaRoot = path.dirname(require.resolve('prisma/package.json'))
  return path.join(prismaRoot, 'build', 'index.js')
}

/**
 * Runs once per `vitest` process: reset test SQLite and sync schema.
 * `DATABASE_URL` is also set in `vitest.config.ts` `test.env` for workers.
 */
export default function globalSetup(): void {
  const testDbPath = path.join(process.cwd(), 'prisma', 'test.db')
  if (existsSync(testDbPath)) {
    unlinkSync(testDbPath)
  }

  execFileSync(
    process.execPath,
    [prismaCliPath(), 'db', 'push', '--accept-data-loss', '--skip-generate'],
    {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: 'file:./prisma/test.db' },
    },
  )
}
