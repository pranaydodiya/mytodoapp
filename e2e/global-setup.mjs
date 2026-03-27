import { execFileSync } from 'node:child_process'
import { existsSync, unlinkSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createRequire } from 'node:module'

const E2E_DB = path.join(process.cwd(), 'prisma', 'e2e.db')
const DATABASE_URL = 'file:./prisma/e2e.db'

function prismaCli() {
  const require = createRequire(import.meta.url)
  const root = path.dirname(require.resolve('prisma/package.json'))
  return path.join(root, 'build', 'index.js')
}

function runPrisma(args) {
  execFileSync(process.execPath, [prismaCli(), ...args], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL },
  })
}

export default function globalSetup() {
  if (existsSync(E2E_DB)) {
    unlinkSync(E2E_DB)
  }
  runPrisma(['migrate', 'deploy'])
  runPrisma(['db', 'seed'])
}
