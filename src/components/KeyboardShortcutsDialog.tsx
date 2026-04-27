'use client'

import { useEffect, useId, useRef } from 'react'

const ROWS: { label: string; keys: string; detail: string }[] = [
  {
    label: 'New task',
    keys: 'N',
    detail: 'Focus the main title field at the top of the list.',
  },
  {
    label: 'Search',
    keys: '/',
    detail: 'Jump to the search field without using the pointer.',
  },
  {
    label: 'This dialog',
    keys: '?',
    detail: 'Open this reference. Disabled while focus is inside most text fields.',
  },
  {
    label: 'Close overlays',
    keys: 'Esc',
    detail: 'Close this dialog. Other panels may add their own handling later.',
  },
]

type Props = {
  open: boolean
  onClose: () => void
}

export function KeyboardShortcutsDialog({ open, onClose }: Props) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const labelId = useId()

  useEffect(() => {
    if (!open) {
      return
    }
    closeBtnRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      data-no-todo-shortcuts="true"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-zinc-950/60 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        data-no-todo-shortcuts="true"
      >
        <header className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2 id={labelId} className="text-lg font-semibold">
              Keyboard shortcuts
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              On the home page, with shortcuts enabled. Typing in fields blocks most bindings.
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Close
          </button>
        </header>
        <ul className="max-h-[min(70vh,28rem)] divide-y divide-zinc-100 overflow-y-auto text-sm dark:divide-zinc-800">
          {ROWS.map(row => (
            <li
              key={row.label}
              className="grid grid-cols-[5rem,1fr] gap-3 px-5 py-3"
            >
              <span className="font-mono text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {row.keys}
              </span>
              <div className="min-w-0">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{row.label}</p>
                <p className="text-xs text-zinc-500">{row.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <footer className="border-t border-zinc-100 bg-zinc-50/80 px-5 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50">
          Turn shortcuts off in{' '}
          <a
            className="font-medium text-zinc-800 underline dark:text-zinc-200"
            href="/settings"
          >
            Settings
          </a>
          .
        </footer>
      </div>
    </div>
  )
}
