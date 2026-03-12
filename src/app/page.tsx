'use client'

import { useCallback, useEffect, useState } from 'react'
import { Category, Priority, Todo, TodoStats } from '@/types/todo'
import TodoItem from '@/components/TodoItem'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortField = 'createdAt' | 'dueDate' | 'priority'
export type SortDir   = 'asc' | 'desc'

export interface FilterState {
  search:     string
  priority:   Priority | 'all'
  categoryId: number | null | 'all'
  completed:  boolean | 'all'
  sort:       SortField
  sortDir:    SortDir
}

const DEFAULT_FILTERS: FilterState = {
  search:     '',
  priority:   'all',
  categoryId: 'all',
  completed:  'all',
  sort:       'createdAt',
  sortDir:    'desc',
}

// ─── API helpers modified ──────────────────────────────────────────────────────────────

async function apiFetchTodos(filters: FilterState): Promise<Todo[]> {
  const p = new URLSearchParams()
  if (filters.priority   !== 'all') p.set('priority',   filters.priority)
  if (filters.categoryId !== 'all') p.set('categoryId', String(filters.categoryId))
  if (filters.completed  !== 'all') p.set('completed',  String(filters.completed))
  p.set('sort',    filters.sort)
  p.set('sortDir', filters.sortDir)
  const res = await fetch(`/api/todos?${p}`)
  if (!res.ok) throw new Error('Failed to fetch todos')
  return res.json()
}

async function apiFetchCategories(): Promise<Category[]> {
  const res = await fetch('/api/categories')
  if (!res.ok) throw new Error('Failed to fetch categories')
  return res.json()
}

async function apiFetchStats(): Promise<TodoStats> {
  const res = await fetch('/api/stats')
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

async function apiCreateTodo(payload: {
  text: string; priority: Priority; categoryId: number | null; dueDate: string | null
}): Promise<Todo> {
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to create todo')
  return res.json()
}

async function apiUpdateTodo(payload: Partial<Todo> & { id: number }): Promise<Todo> {
  const res = await fetch('/api/todos', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update todo')
  return res.json()
}

async function apiDeleteTodo(id: number): Promise<void> {
  const res = await fetch(`/api/todos?id=${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete todo')
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [todos,      setTodos]      = useState<Todo[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats,      setStats]      = useState<TodoStats | null>(null)
  const [filters,    setFilters]    = useState<FilterState>(DEFAULT_FILTERS)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [isFormOpen,  setIsFormOpen]  = useState(false)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const refreshStats = () => apiFetchStats().then(setStats).catch(() => {})

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [fetchedTodos, fetchedCategories, fetchedStats] = await Promise.all([
        apiFetchTodos(filters),
        apiFetchCategories(),
        apiFetchStats(),
      ])
      setTodos(fetchedTodos)
      setCategories(fetchedCategories)
      setStats(fetchedStats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { loadData() }, [loadData])

  const visibleTodos = filters.search.trim()
    ? todos.filter(t => t.text.toLowerCase().includes(filters.search.toLowerCase()))
    : todos

  async function handleToggle(id: number) {
    const todo = todos.find(t => t.id === id)
    if (!todo) return
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
    try {
      await apiUpdateTodo({ id, completed: !todo.completed })
      refreshStats()
    } catch {
      setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: todo.completed } : t))
    }
  }

  async function handleDelete(id: number) {
    const snapshot = todos
    setTodos(prev => prev.filter(t => t.id !== id))
    try {
      await apiDeleteTodo(id)
      refreshStats()
    } catch {
      setTodos(snapshot)
    }
  }

  function handleEdit(todo: Todo) {
    setEditingTodo(todo)
    setIsFormOpen(true)
  }

  function openNewForm() {
    setEditingTodo(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingTodo(null)
  }

  async function handleCreate(payload: {
    text: string; priority: Priority; categoryId: number | null; dueDate: string | null
  }) {
    const newTodo = await apiCreateTodo(payload)
    setTodos(prev => [newTodo, ...prev])
    refreshStats()
    closeForm()
  }

  async function handleUpdate(payload: Partial<Todo> & { id: number }) {
    const updated = await apiUpdateTodo(payload)
    setTodos(prev => prev.map(t => t.id === updated.id ? updated : t))
    refreshStats()
    closeForm()
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4 py-10">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              My Tasks
            </h1>
            {stats && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {stats.completed} of {stats.total} completed
                {stats.overdue > 0 && (
                  <span className="ml-2 font-medium text-red-500">
                    · {stats.overdue} overdue
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={openNewForm}
            className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Task
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            ))}
          </div>
        )}

        {/* Todo list */}
        {!loading && (
          visibleTodos.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <svg className="h-12 w-12 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
                No tasks yet — add your first one!
              </p>
              <button
                onClick={openNewForm}
                className="mt-1 text-sm font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Create a task
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {visibleTodos.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  categories={categories}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}
            </ul>
          )
        )}
      </div>

      {/* Modal */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) closeForm() }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {editingTodo ? 'Edit Task' : 'New Task'}
            </h2>
            <InlineForm
              initial={editingTodo}
              categories={categories}
              onSave={editingTodo
                ? (p) => handleUpdate({ id: editingTodo.id, ...p })
                : handleCreate
              }
              onCancel={closeForm}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Inline form ──────────────────────────────────────────────────────────────

const PRIORITIES: Priority[] = ['low', 'medium', 'high']

const priorityActiveStyle: Record<Priority, string> = {
  low:    'bg-emerald-100 text-emerald-700 ring-emerald-400 dark:bg-emerald-900/40 dark:text-emerald-300',
  medium: 'bg-amber-100  text-amber-700  ring-amber-400  dark:bg-amber-900/40  dark:text-amber-300',
  high:   'bg-red-100    text-red-700    ring-red-400    dark:bg-red-900/40    dark:text-red-300',
}

interface InlineFormProps {
  initial:    Todo | null
  categories: Category[]
  onSave:     (p: { text: string; priority: Priority; categoryId: number | null; dueDate: string | null }) => Promise<void>
  onCancel:   () => void
}

function InlineForm({ initial, categories, onSave, onCancel }: InlineFormProps) {
  const [text,       setText]       = useState(initial?.text       ?? '')
  const [priority,   setPriority]   = useState<Priority>(initial?.priority   ?? 'medium')
  const [categoryId, setCategoryId] = useState<number | null>(initial?.categoryId ?? null)
  const [dueDate,    setDueDate]    = useState(initial?.dueDate ?? '')
  const [saving,     setSaving]     = useState(false)
  const [formError,  setFormError]  = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) { setFormError('Task text is required'); return }
    setSaving(true)
    setFormError(null)
    try {
      await onSave({ text: text.trim(), priority, categoryId, dueDate: dueDate || null })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Task</label>
        <textarea
          rows={3}
          autoFocus
          placeholder="What needs to be done?"
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-700"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Priority</label>
        <div className="flex gap-2">
          {PRIORITIES.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all
                ${priority === p
                  ? priorityActiveStyle[p] + ' ring-2 ring-offset-1'
                  : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Category</label>
          <select
            value={categoryId ?? ''}
            onChange={e => setCategoryId(e.target.value === '' ? null : Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">None</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>
      {formError && <p className="text-xs text-red-600 dark:text-red-400">{formError}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !text.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add task'}
        </button>
      </div>
    </form>
  )
}
