import { execFileSync } from 'node:child_process'
import { existsSync, unlinkSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createRequire } from 'node:module'
import { afterAll, beforeAll } from 'vitest'

process.env.DATABASE_URL = 'file:./prisma/test.db'

const testDbPath = path.join(process.cwd(), 'prisma', 'test.db')

function prismaCliPath(): string {
  const require = createRequire(import.meta.url)
  const prismaRoot = path.dirname(require.resolve('prisma/package.json'))
  return path.join(prismaRoot, 'build', 'index.js')
}

beforeAll(() => {
  if (existsSync(testDbPath)) {
    unlinkSync(testDbPath)
  }
  execFileSync(
    process.execPath,
    [prismaCliPath(), 'db', 'push', '--accept-data-loss', '--skip-generate'],
    {
      stdio: 'inherit',
      env: { ...process.env },
    },
  )
})

afterAll(async () => {
  const { prisma } = await import('@/lib/prisma')
  await prisma.$disconnect()
})
