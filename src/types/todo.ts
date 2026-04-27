export type Priority = 'low' | 'medium' | 'high'

export interface Category {
  id: number
  name: string
  color: string // hex colour e.g. "#3b82f6"
}

/** A checklist item that belongs to a parent todo. */
export interface Subtask {
  id: number
  text: string
  completed: boolean
  /** Order within the parent (0 = first). */
  position: number
  createdAt: string
}

/** JSON shape returned by `/api/todos` and accepted by the client. */
export interface Todo {
  id: number
  text: string
  completed: boolean
  priority: Priority
  categoryId: number | null
  /** Calendar date in UTC (`YYYY-MM-DD`), or null. */
  dueDate: string | null
  /** ISO-8601 instant string. */
  createdAt: string
  /** Checklist items when requested or after mutations. Empty array if none. */
  subtasks: Subtask[]
}

export interface TodoStats {
  total: number
  completed: number
  pending: number
  overdue: number
  byPriority: Record<Priority, number>
  byCategory: { categoryId: number | null; name: string; color?: string; count: number }[]
}
