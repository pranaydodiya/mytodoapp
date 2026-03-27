'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Category, Priority, Todo, TodoStats } from '@/types/todo'

type FilterState = {
  search: string
  completed: 'all' | 'completed' | 'pending'
  priority: 'all' | Priority
  categoryId: number | null | 'all'
}

type LoadingState = 'idle' | 'loading' | 'error'

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<TodoStats | null>(null)

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    completed: 'all',
    priority: 'all',
    categoryId: 'all',
  })

  const [loading, setLoading] = useState<LoadingState>('idle')
  const [error, setError] = useState<string | null>(null)

  const [newText, setNewText] = useState('')
  const [newPriority, setNewPriority] = useState<Priority>('medium')
  /** `''` = “(none)”; `null` = explicit uncategorized; otherwise a category id. */
  const [newCategoryId, setNewCategoryId] = useState<number | null | ''>('')
  const [newDueDate, setNewDueDate] = useState('')

  const hasTodos = useMemo(() => todos.length > 0, [todos])

  async function fetchCategories() {
    const res = await fetch('/api/categories')
    if (!res.ok) throw new Error('Failed to load categories')
    const data: Category[] = await res.json()
    setCategories(data)
  }

  async function fetchStats() {
    const res = await fetch('/api/stats')
    if (!res.ok) throw new Error('Failed to load stats')
    const data: TodoStats = await res.json()
    setStats(data)
  }

  async function fetchTodos(currentFilters: FilterState) {
    const params = new URLSearchParams()
    if (currentFilters.search.trim()) params.set('search', currentFilters.search.trim())
    if (currentFilters.completed === 'completed') params.set('completed', 'true')
    if (currentFilters.completed === 'pending') params.set('completed', 'false')
    if (currentFilters.priority !== 'all') params.set('priority', currentFilters.priority)
    if (currentFilters.categoryId === null) {
      params.set('categoryId', 'null')
    } else if (currentFilters.categoryId !== 'all') {
      params.set('categoryId', String(currentFilters.categoryId))
    }

    const query = params.toString()
    const res = await fetch(`/api/todos${query ? `?${query}` : ''}`)
    if (!res.ok) throw new Error('Failed to load todos')
    const data: Todo[] = await res.json()
    setTodos(data)
  }

  async function refreshAll(currentFilters: FilterState = filters) {
    try {
      setLoading('loading')
      setError(null)
      await Promise.all([fetchCategories(), fetchTodos(currentFilters), fetchStats()])
      setLoading('idle')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading('error')
    }
  }

  useEffect(() => {
    void refreshAll(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCreateTodo(e: React.FormEvent) {
    e.preventDefault()
    const text = newText.trim()
    if (!text) return

    try {
      setError(null)
      const categoryIdForApi: number | null =
        newCategoryId === '' ? null : newCategoryId

      const body: {
        text: string
        priority: Priority
        categoryId: number | null
        dueDate?: string
      } = {
        text,
        priority: newPriority,
        categoryId: categoryIdForApi,
      }
      if (newDueDate) {
        body.dueDate = newDueDate
      }

      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create todo')
      }

      setNewText('')
      setNewDueDate('')
      setNewPriority('medium')
      setNewCategoryId('')
      await refreshAll(filters)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to create todo')
    }
  }

  async function toggleTodo(todo: Todo) {
    try {
      setError(null)
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update todo')
      }
      await refreshAll(filters)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to update todo')
    }
  }

  async function deleteTodo(id: number) {
    try {
      setError(null)
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete todo')
      }
      await refreshAll(filters)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to delete todo')
    }
  }

  function handleFilterChange(partial: Partial<FilterState>) {
    const nextFilters = { ...filters, ...partial }
    setFilters(nextFilters)
    void fetchTodos(nextFilters).catch(err => {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to load todos')
    })
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row">
        <aside className="w-full space-y-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900 md:w-72">
          <header>
            <h1 className="text-xl font-semibold tracking-tight">Tasks</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Manage your daily todos with priorities, categories, and due dates.
            </p>
          </header>

          {stats && (
            <section className="space-y-3">
              <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Overview
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Total" value={stats.total} />
                <StatCard label="Completed" value={stats.completed} />
                <StatCard label="Pending" value={stats.pending} />
                <StatCard label="Overdue" value={stats.overdue} />
              </div>
            </section>
          )}

          <section className="space-y-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Categories
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleFilterChange({ categoryId: 'all' })}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  filters.categoryId === 'all'
                    ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange({ categoryId: null })}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  filters.categoryId === null
                    ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                Uncategorized
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleFilterChange({ categoryId: category.id })}
                  className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                    filters.categoryId === category.id
                      ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main className="flex-1 space-y-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
          <section className="space-y-3">
            <form onSubmit={handleCreateTodo} className="space-y-3">
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  type="text"
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  placeholder="What do you need to get done?"
                  className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  disabled={!newText.trim()}
                >
                  Add task
                </button>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                <label className="flex items-center gap-2">
                  <span className="text-xs font-medium">Priority</span>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as Priority)}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-xs font-medium">Category</span>
                  <select
                    value={
                      newCategoryId === ''
                        ? ''
                        : newCategoryId === null
                          ? 'null'
                          : String(newCategoryId)
                    }
                    onChange={e => {
                      const value = e.target.value
                      if (value === '') setNewCategoryId('')
                      else if (value === 'null') setNewCategoryId(null)
                      else setNewCategoryId(Number(value))
                    }}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    <option value="">(none)</option>
                    <option value="null">Uncategorized</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-xs font-medium">Due</span>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
              </div>
            </form>
          </section>

          <section className="space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleFilterChange({ completed: 'all' })}
                  className={`rounded-full px-3 py-1 font-medium ${
                    filters.completed === 'all'
                      ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange({ completed: 'pending' })}
                  className={`rounded-full px-3 py-1 font-medium ${
                    filters.completed === 'pending'
                      ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange({ completed: 'completed' })}
                  className={`rounded-full px-3 py-1 font-medium ${
                    filters.completed === 'completed'
                      ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  Completed
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={filters.priority}
                  onChange={e =>
                    handleFilterChange({
                      priority: e.target.value as FilterState['priority'],
                    })
                  }
                  className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="all">All priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <input
                  type="search"
                  value={filters.search}
                  onChange={e => handleFilterChange({ search: e.target.value })}
                  placeholder="Search tasks"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-500 dark:focus:ring-zinc-800 md:w-48"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-100 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}

            {loading === 'loading' && !hasTodos ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Loading your tasks…
              </p>
            ) : !hasTodos ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No tasks yet. Create your first one above.
              </p>
            ) : (
              <ul className="space-y-2">
                {todos.map(todo => (
                  <li
                    key={todo.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <button
                      type="button"
                      onClick={() => void toggleTodo(todo)}
                      className="flex flex-1 items-start gap-3 text-left"
                    >
                      <span
                        className={`mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                          todo.completed
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-zinc-300 bg-white text-transparent dark:border-zinc-700 dark:bg-zinc-900'
                        }`}
                      >
                        ✓
                      </span>
                      <span className="flex flex-1 flex-col gap-1">
                        <span
                          className={`text-sm ${
                            todo.completed
                              ? 'text-zinc-400 line-through'
                              : 'text-zinc-900 dark:text-zinc-50'
                          }`}
                        >
                          {todo.text}
                        </span>
                        <span className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                          <PriorityBadge priority={todo.priority} />
                          {todo.categoryId !== null && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    categories.find(c => c.id === todo.categoryId)?.color ??
                                    '#a1a1aa',
                                }}
                              />
                              {
                                categories.find(c => c.id === todo.categoryId)?.name ??
                                'Category'
                              }
                            </span>
                          )}
                          {todo.dueDate && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
                                !todo.completed &&
                                new Date(todo.dueDate) < new Date()
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                              }`}
                            >
                              <span>Due</span>
                              <span>{todo.dueDate}</span>
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-400">
                            Created {new Date(todo.createdAt).toLocaleDateString()}
                          </span>
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteTodo(todo.id)}
                      className="ml-2 rounded-full px-2 py-1 text-xs text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-[11px] text-zinc-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const config: Record<
    Priority,
    { label: string; className: string }
  > = {
    low: {
      label: 'Low',
      className:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    },
    medium: {
      label: 'Medium',
      className:
        'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    },
    high: {
      label: 'High',
      className: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
    },
  }

  const { label, className } = config[priority]

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 ${className}`}>
      {label} priority
    </span>
  )
}
