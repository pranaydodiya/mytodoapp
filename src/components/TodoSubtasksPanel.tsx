'use client'

import { useState } from 'react'
import type { AppSettings } from '@/lib/app-settings'
import type { Subtask, Todo } from '@/types/todo'

type Props = {
  todo: Todo
  settings: AppSettings
  disabled: boolean
  onTodoUpdated: (todo: Todo) => void
  onError: (message: string) => void
}

export function TodoSubtasksPanel({
  todo,
  settings,
  disabled,
  onTodoUpdated,
  onError,
}: Props) {
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)

  const compact = settings.subtasksCompact
  const subtasks = todo.subtasks ?? []

  async function patchSubtask(
    subtaskId: number,
    body: { text?: string; completed?: boolean; position?: number },
  ) {
    setBusy(subtaskId)
    try {
      const res = await fetch(`/api/todos/${todo.id}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Could not update checklist item')
      }
      const data: { todo: Todo } = await res.json()
      onTodoUpdated(data.todo)
    } catch (err) {
      console.error(err)
      onError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusy(null)
    }
  }

  async function addSubtask(e: React.FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) {
      return
    }
    setAdding(true)
    try {
      const res = await fetch(`/api/todos/${todo.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Could not add checklist item')
      }
      const data: { todo: Todo } = await res.json()
      onTodoUpdated(data.todo)
      setDraft('')
    } catch (err) {
      console.error(err)
      onError(err instanceof Error ? err.message : 'Add failed')
    } finally {
      setAdding(false)
    }
  }

  async function deleteSubtask(subtaskId: number) {
    setBusy(subtaskId)
    try {
      const res = await fetch(`/api/todos/${todo.id}/subtasks/${subtaskId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Could not remove item')
      }
      const data: { todo: Todo } = await res.json()
      onTodoUpdated(data.todo)
    } catch (err) {
      console.error(err)
      onError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setBusy(null)
    }
  }

  function indexOf(id: number) {
    return subtasks.findIndex(s => s.id === id)
  }

  function move(sub: Subtask, direction: -1 | 1) {
    const i = indexOf(sub.id)
    if (i < 0) {
      return
    }
    const next = i + direction
    if (next < 0 || next >= subtasks.length) {
      return
    }
    void patchSubtask(sub.id, { position: next })
  }

  const padding = compact ? 'py-0.5' : 'py-1.5'

  return (
    <div
      className="mt-2 border-t border-zinc-100 pt-2 text-xs dark:border-zinc-800"
      data-no-todo-shortcuts="true"
    >
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
        Checklist
        {subtasks.length > 0 && (
          <span className="ml-2 font-normal normal-case text-zinc-500">
            {subtasks.filter(s => s.completed).length}/{subtasks.length} done
          </span>
        )}
      </p>
      {subtasks.length > 0 && (
        <ul className={`mb-2 space-y-1 ${compact ? '' : 'space-y-1.5'}`} aria-label="Subtasks">
          {subtasks.map(sub => (
            <li
              key={sub.id}
              className={`flex items-center gap-2 rounded-lg bg-white/60 px-2 dark:bg-zinc-900/40 ${padding}`}
            >
              <button
                type="button"
                disabled={disabled || busy === sub.id}
                onClick={() =>
                  void patchSubtask(sub.id, { completed: !sub.completed })
                }
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-zinc-300 text-[10px] dark:border-zinc-600"
                aria-pressed={sub.completed}
                aria-label={sub.completed ? 'Mark incomplete' : 'Mark done'}
              >
                {sub.completed ? '✓' : ''}
              </button>
              <span
                className={`min-w-0 flex-1 ${
                  sub.completed ? 'text-zinc-400 line-through' : 'text-zinc-800 dark:text-zinc-100'
                }`}
              >
                {sub.text}
              </span>
              <div className="flex shrink-0 gap-0.5">
                <button
                  type="button"
                  disabled={disabled || busy === sub.id || indexOf(sub.id) === 0}
                  className="rounded px-1 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                  onClick={() => move(sub, -1)}
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={
                    disabled ||
                    busy === sub.id ||
                    indexOf(sub.id) === subtasks.length - 1
                  }
                  className="rounded px-1 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                  onClick={() => move(sub, 1)}
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={disabled || busy === sub.id}
                  className="rounded px-1 text-zinc-400 hover:text-red-600 disabled:opacity-30"
                  onClick={() => void deleteSubtask(sub.id)}
                  aria-label="Remove subtask"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={e => void addSubtask(e)} className="flex flex-wrap gap-2">
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Add a checklist item"
          disabled={disabled || adding}
          className="min-w-[10rem] flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button
          type="submit"
          disabled={disabled || adding || !draft.trim()}
          className="rounded-lg bg-zinc-200 px-2 py-1 text-xs font-medium text-zinc-800 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {adding ? '…' : 'Add'}
        </button>
      </form>
    </div>
  )
}
