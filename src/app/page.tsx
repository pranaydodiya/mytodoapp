'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { downloadTodosAsJson } from '@/lib/todo-export'
import type { TodoSort } from '@/lib/todo-sort'
import type { Category, Priority, Todo, TodoStats } from '@/types/todo'

type DuePreset = 'all' | 'today' | 'overdue' | 'no_due'

type FilterState = {
  search: string
  completed: 'all' | 'completed' | 'pending'
  priority: 'all' | Priority
  categoryId: number | null | 'all'
  sort: TodoSort
  duePreset: DuePreset
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
    sort: 'createdAt_desc',
    duePreset: 'all',
  })

  const [loading, setLoading] = useState<LoadingState>('idle')
  const [listLoading, setListLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [todoBusyId, setTodoBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtersRef = useRef(filters)
  filtersRef.current = filters
  const skipInitialSearchEffect = useRef(true)

  const [newText, setNewText] = useState('')
  const [newPriority, setNewPriority] = useState<Priority>('medium')
  /** `''` = “(none)”; `null` = explicit uncategorized; otherwise a category id. */
  const [newCategoryId, setNewCategoryId] = useState<number | null | ''>('')
  const [newDueDate, setNewDueDate] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [editPriority, setEditPriority] = useState<Priority>('medium')
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null)
  const [editDueDate, setEditDueDate] = useState('')

  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#6b7280')
  const [addingCategory, setAddingCategory] = useState(false)

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

  async function fetchTodos(
    currentFilters: FilterState,
    opts?: { showListSpinner?: boolean },
  ) {
    if (opts?.showListSpinner) setListLoading(true)
    try {
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
      params.set('sort', currentFilters.sort)
      if (currentFilters.duePreset !== 'all') {
        params.set('due', currentFilters.duePreset)
      }

      const query = params.toString()
      const res = await fetch(`/api/todos${query ? `?${query}` : ''}`)
      if (!res.ok) throw new Error('Failed to load todos')
      const data: Todo[] = await res.json()
      setTodos(data)
    } finally {
      if (opts?.showListSpinner) setListLoading(false)
    }
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

  useEffect(() => {
    if (skipInitialSearchEffect.current) {
      skipInitialSearchEffect.current = false
      return
    }
    const id = window.setTimeout(() => {
      void fetchTodos(filtersRef.current, { showListSpinner: true }).catch(err => {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Failed to load todos')
      })
    }, 300)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce only when search string changes
  }, [filters.search])

  async function handleCreateTodo(e: React.FormEvent) {
    e.preventDefault()
    const text = newText.trim()
    if (!text) return

    try {
      setError(null)
      setCreating(true)
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
    } finally {
      setCreating(false)
    }
  }

  async function toggleTodo(todo: Todo) {
    try {
      setError(null)
      setTodoBusyId(todo.id)
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
    } finally {
      setTodoBusyId(null)
    }
  }

  async function deleteTodo(id: number) {
    try {
      setError(null)
      setTodoBusyId(id)
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete todo')
      }
      await refreshAll(filters)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to delete todo')
    } finally {
      setTodoBusyId(null)
    }
  }

  function handleFilterChange(partial: Partial<FilterState>) {
    const nextFilters = { ...filters, ...partial }
    setFilters(nextFilters)
    void fetchTodos(nextFilters, { showListSpinner: true }).catch(err => {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to load todos')
    })
  }

  function beginEdit(todo: Todo) {
    setError(null)
    setEditingId(todo.id)
    setEditText(todo.text)
    setEditPriority(todo.priority)
    setEditCategoryId(todo.categoryId)
    setEditDueDate(todo.dueDate ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    const name = newCategoryName.trim()
    if (!name) return

    try {
      setError(null)
      setAddingCategory(true)
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color: newCategoryColor }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to add category')
      }
      setNewCategoryName('')
      setNewCategoryColor('#6b7280')
      await refreshAll(filters)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to add category')
    } finally {
      setAddingCategory(false)
    }
  }

  async function duplicateTodo(id: number) {
    try {
      setError(null)
      setTodoBusyId(id)
      const res = await fetch(`/api/todos/${id}/duplicate`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to duplicate')
      }
      await refreshAll(filters)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to duplicate')
    } finally {
      setTodoBusyId(null)
    }
  }

  async function clearCompletedTodos() {
    if (!stats?.completed) return
    if (!window.confirm(`Delete ${stats.completed} completed task(s)?`)) return
    try {
      setError(null)
      const res = await fetch('/api/todos/completed', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to clear completed')
      }
      await refreshAll(filters)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to clear completed')
    }
  }

  async function completeAllPending() {
    if (!stats?.pending) return
    if (!window.confirm(`Mark all ${stats.pending} active task(s) as done?`)) return
    try {
      setError(null)
      const res = await fetch('/api/todos/complete-all', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to complete all')
      }
      await refreshAll(filters)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to complete all')
    }
  }

  function handleExportTodos() {
    downloadTodosAsJson(todos)
  }

  async function saveEdit(e: React.FormEvent, todoId: number) {
    e.preventDefault()
    const text = editText.trim()
    if (!text) return

    try {
      setError(null)
      setTodoBusyId(todoId)
      const res = await fetch(`/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          priority: editPriority,
          categoryId: editCategoryId,
          dueDate: editDueDate ? editDueDate : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update todo')
      }

      setEditingId(null)
      await refreshAll(filters)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to update todo')
    } finally {
      setTodoBusyId(null)
    }
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
            <form
              onSubmit={e => void handleAddCategory(e)}
              className="flex flex-col gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800"
            >
              <p className="text-[11px] font-medium text-zinc-500">New category</p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="Name"
                  className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                />
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={e => setNewCategoryColor(e.target.value)}
                  className="h-7 w-10 cursor-pointer rounded border border-zinc-200 dark:border-zinc-700"
                  title="Color"
                />
                <button
                  type="submit"
                  disabled={addingCategory || !newCategoryName.trim()}
                  className="rounded-lg bg-zinc-200 px-2 py-1 text-xs font-medium text-zinc-800 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  {addingCategory ? '…' : 'Add'}
                </button>
              </div>
            </form>
          </section>
        </aside>

        <main className="flex-1 space-y-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
          <section className="space-y-3">
            <form onSubmit={handleCreateTodo} className="space-y-3">
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  type="text"
                  data-testid="task-title-input"
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  placeholder="What do you need to get done?"
                  className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                />
                <button
                  type="submit"
                  data-testid="add-task-button"
                  className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  disabled={creating || !newText.trim()}
                  aria-busy={creating}
                >
                  {creating ? 'Adding…' : 'Add task'}
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

          <section className="flex flex-wrap gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleExportTodos}
              disabled={!hasTodos}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => void completeAllPending()}
              disabled={!stats?.pending}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200"
            >
              Complete all active
            </button>
            <button
              type="button"
              onClick={() => void clearCompletedTodos()}
              disabled={!stats?.completed}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-40 dark:border-red-900 dark:text-red-300"
            >
              Clear completed
            </button>
          </section>

          <section className="space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-col gap-2">
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
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="self-center text-zinc-500">Due:</span>
                <button
                  type="button"
                  onClick={() => handleFilterChange({ duePreset: 'all' })}
                  className={`rounded-full px-3 py-1 font-medium ${
                    filters.duePreset === 'all'
                      ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  Any
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange({ duePreset: 'today' })}
                  className={`rounded-full px-3 py-1 font-medium ${
                    filters.duePreset === 'today'
                      ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange({ duePreset: 'overdue' })}
                  className={`rounded-full px-3 py-1 font-medium ${
                    filters.duePreset === 'overdue'
                      ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  Overdue
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange({ duePreset: 'no_due' })}
                  className={`rounded-full px-3 py-1 font-medium ${
                    filters.duePreset === 'no_due'
                      ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  No date
                </button>
              </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <label className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium">Sort</span>
                  <select
                    value={filters.sort}
                    onChange={e =>
                      handleFilterChange({
                        sort: e.target.value as TodoSort,
                      })
                    }
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    <option value="createdAt_desc">Newest first</option>
                    <option value="createdAt_asc">Oldest first</option>
                    <option value="dueDate_asc">Due date (soonest)</option>
                    <option value="dueDate_desc">Due date (latest)</option>
                    <option value="priority_desc">Priority (high → low)</option>
                    <option value="priority_asc">Priority (low → high)</option>
                  </select>
                </label>
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
                  data-testid="task-search-input"
                  value={filters.search}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, search: e.target.value }))
                  }
                  placeholder="Search tasks"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-500 dark:focus:ring-zinc-800 md:w-48"
                  aria-busy={listLoading}
                />
              </div>
            </div>

            {listLoading && (
              <p
                data-testid="list-updating-indicator"
                className="text-xs text-zinc-500 dark:text-zinc-400"
                aria-live="polite"
              >
                Updating list…
              </p>
            )}

            {error && (
              <p
                data-testid="error-banner"
                className="rounded-lg bg-red-100 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300"
                role="alert"
              >
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
              <ul data-testid="task-list" className="space-y-2">
                {todos.map(todo => (
                  <li
                    key={todo.id}
                    className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    {editingId === todo.id ? (
                      <form
                        className="flex flex-col gap-2"
                        onSubmit={e => void saveEdit(e, todo.id)}
                      >
                        <input
                          type="text"
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                          autoFocus
                        />
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <select
                            value={editPriority}
                            onChange={e =>
                              setEditPriority(e.target.value as Priority)
                            }
                            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                          <select
                            value={editCategoryId === null ? '' : String(editCategoryId)}
                            onChange={e => {
                              const v = e.target.value
                              setEditCategoryId(v === '' ? null : Number(v))
                            }}
                            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950"
                          >
                            <option value="">Uncategorized</option>
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={e => setEditDueDate(e.target.value)}
                            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={todoBusyId === todo.id || !editText.trim()}
                            className="rounded-lg bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-50 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={todoBusyId === todo.id}
                            className="rounded-lg border border-zinc-200 px-3 py-1 text-xs dark:border-zinc-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => void toggleTodo(todo)}
                          disabled={
                            todoBusyId === todo.id || editingId !== null
                          }
                          aria-busy={todoBusyId === todo.id}
                          className="flex min-w-0 flex-1 items-start gap-3 text-left disabled:cursor-wait disabled:opacity-70"
                        >
                          <span
                            className={`mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                              todo.completed
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-zinc-300 bg-white text-transparent dark:border-zinc-700 dark:bg-zinc-900'
                            }`}
                          >
                            ✓
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col gap-1">
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
                                        categories.find(c => c.id === todo.categoryId)
                                          ?.color ?? '#a1a1aa',
                                    }}
                                  />
                                  {categories.find(c => c.id === todo.categoryId)?.name ??
                                    'Category'}
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
                                Created{' '}
                                {new Date(todo.createdAt).toLocaleDateString()}
                              </span>
                            </span>
                          </span>
                        </button>
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => void duplicateTodo(todo.id)}
                            disabled={
                              todoBusyId !== null || editingId !== null
                            }
                            className="rounded-full px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-200 disabled:opacity-40 dark:hover:bg-zinc-800"
                          >
                            Copy
                          </button>
                          <button
                            type="button"
                            onClick={() => beginEdit(todo)}
                            disabled={
                              todoBusyId !== null || editingId !== null
                            }
                            className="rounded-full px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-200 disabled:opacity-40 dark:hover:bg-zinc-800"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteTodo(todo.id)}
                            disabled={
                              todoBusyId === todo.id || editingId !== null
                            }
                            className="rounded-full px-2 py-1 text-xs text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-wait disabled:opacity-70 dark:hover:bg-red-950"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
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
