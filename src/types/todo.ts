export type Priority = 'low' | 'medium' | 'high'

export interface Category {
  id: number
  name: string
  color: string // hex colour e.g. "#3b82f6"
}

export interface Todo {
  id: number
  text: string
  completed: boolean
  priority: Priority
  categoryId: number | null
  dueDate: string | null   // "YYYY-MM-DD"
  createdAt: string        // ISO datetime
}

export interface TodoStats {
  total: number
  completed: number
  pending: number
  overdue: number
  byPriority: Record<Priority, number>
  byCategory: { categoryId: number | null; name: string; color?: string; count: number }[]
}
