import { Todo, Category } from '@/types/todo'

// In-memory store shared across all API routes in a single server process.
// Replace with a database for persistence across restarts.

export const todos: Todo[] = []

export const categories: Category[] = [
  { id: 1, name: 'Work',     color: '#3b82f6' },
  { id: 2, name: 'Personal', color: '#10b981' },
  { id: 3, name: 'Shopping', color: '#f59e0b' },
  { id: 4, name: 'Health',   color: '#ef4444' },
]
