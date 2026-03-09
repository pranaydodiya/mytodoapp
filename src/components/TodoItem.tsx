'use client'

import { Todo, Category } from '@/types/todo'
import PriorityBadge from './PriorityBadge'
import CategoryTag from './CategoryTag'

interface Props {
  todo: Todo
  categories: Category[]
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  onEdit:   (todo: Todo) => void
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function isOverdue(todo: Todo): boolean {
  if (!todo.dueDate || todo.completed) return false
  return new Date(todo.dueDate + 'T00:00:00') < new Date(new Date().toDateString())
}

export default function TodoItem({ todo, categories, onToggle, onDelete, onEdit }: Props) {
  const category = categories.find(c => c.id === todo.categoryId) ?? null
  const overdue = isOverdue(todo)

  return (
    <li
      className={`group flex items-start gap-3 rounded-xl border p-4 transition-all
        ${todo.completed
          ? 'border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-700 dark:bg-zinc-900'
          : overdue
            ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30'
            : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800'
        }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(todo.id)}
        aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors
          ${todo.completed
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-zinc-400 hover:border-emerald-400 dark:border-zinc-500'
          }`}
      >
        {todo.completed && (
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium leading-6 ${todo.completed ? 'line-through text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
          {todo.text}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <PriorityBadge priority={todo.priority} />
          {category && <CategoryTag category={category} />}
          {todo.dueDate && (
            <span className={`text-xs ${overdue ? 'font-semibold text-red-600 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
              {overdue ? '⚠ Overdue · ' : '📅 Due '}
              {formatDate(todo.dueDate)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <button
          onClick={() => onEdit(todo)}
          aria-label="Edit todo"
          className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          aria-label="Delete todo"
          className="rounded-md p-1.5 text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40 dark:hover:text-red-400"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </li>
  )
}
