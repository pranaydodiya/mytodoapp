import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Help | Todo app',
  description: 'Tips and API reference for the todo app.',
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto max-w-2xl space-y-10">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Help</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Using the app</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Use the sidebar for categories and overview. The main panel is for adding tasks,
            filters, sorting, and bulk tools. Search is debounced; other filters apply
            immediately.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Tips</h2>
          <ul className="list-inside list-disc space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              <strong className="font-medium text-zinc-800 dark:text-zinc-200">Due filters</strong>{' '}
              use UTC calendar days on the server (Today / Overdue / No date).
            </li>
            <li>
              <strong className="font-medium text-zinc-800 dark:text-zinc-200">Clear completed</strong>{' '}
              and <strong className="font-medium text-zinc-800 dark:text-zinc-200">Complete all</strong>{' '}
              ask for confirmation first.
            </li>
            <li>
              <strong className="font-medium text-zinc-800 dark:text-zinc-200">Export JSON</strong>{' '}
              downloads the tasks currently shown (respects filters).
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">API overview</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white text-xs dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="p-3 font-medium">Method</th>
                  <th className="p-3 font-medium">Path</th>
                  <th className="p-3 font-medium">Purpose</th>
                </tr>
              </thead>
              <tbody className="text-zinc-600 dark:text-zinc-400">
                <tr className="border-b border-zinc-100 dark:border-zinc-800/80">
                  <td className="p-3 font-mono">GET/POST</td>
                  <td className="p-3 font-mono">/api/todos</td>
                  <td className="p-3">List (query filters + sort) or create</td>
                </tr>
                <tr className="border-b border-zinc-100 dark:border-zinc-800/80">
                  <td className="p-3 font-mono">PATCH/DELETE</td>
                  <td className="p-3 font-mono">/api/todos/[id]</td>
                  <td className="p-3">Update fields or delete</td>
                </tr>
                <tr className="border-b border-zinc-100 dark:border-zinc-800/80">
                  <td className="p-3 font-mono">POST</td>
                  <td className="p-3 font-mono">/api/todos/[id]/duplicate</td>
                  <td className="p-3">Duplicate task (new id, not completed)</td>
                </tr>
                <tr className="border-b border-zinc-100 dark:border-zinc-800/80">
                  <td className="p-3 font-mono">DELETE</td>
                  <td className="p-3 font-mono">/api/todos/completed</td>
                  <td className="p-3">Remove all completed todos</td>
                </tr>
                <tr className="border-b border-zinc-100 dark:border-zinc-800/80">
                  <td className="p-3 font-mono">POST</td>
                  <td className="p-3 font-mono">/api/todos/complete-all</td>
                  <td className="p-3">Mark every pending todo completed</td>
                </tr>
                <tr className="border-b border-zinc-100 dark:border-zinc-800/80">
                  <td className="p-3 font-mono">GET/POST/DELETE</td>
                  <td className="p-3 font-mono">/api/categories</td>
                  <td className="p-3">List, create, or delete categories</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono">GET</td>
                  <td className="p-3 font-mono">/api/stats</td>
                  <td className="p-3">Aggregated counts</td>
                </tr>
              </tbody>
            </table>
          </div>
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
