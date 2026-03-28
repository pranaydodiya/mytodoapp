import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About | Todo app',
  description: 'What this todo app does and how it is built.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            About
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Todo app</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            A small task list with categories, priorities, due dates, filters, and stats.
            Data is stored locally with SQLite and Prisma, and exposed through Next.js API
            routes.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Features</h2>
          <ul className="list-inside list-disc space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            <li>Create, edit, duplicate, complete, and delete tasks</li>
            <li>Filter by status, priority, category, due window, and search</li>
            <li>Sort by date, due date, or priority</li>
            <li>Overview stats and inline category creation</li>
            <li>Export the visible list as JSON</li>
            <li>Bulk actions: complete all active, clear completed</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Stack</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Next.js (App Router), React, TypeScript, Tailwind CSS, Prisma, SQLite, Vitest,
            and Playwright for tests.
          </p>
        </section>

        <p className="text-sm">
          <Link
            href="/"
            className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-500 dark:text-zinc-50 dark:decoration-zinc-600"
          >
            ← Back to tasks
          </Link>
        </p>
      </div>
    </div>
  )
}
