import type { Priority, Todo as PrismaTodo } from '@prisma/client'

export type TodoSort =
  | 'createdAt_desc'
  | 'createdAt_asc'
  | 'dueDate_asc'
  | 'dueDate_desc'
  | 'priority_desc'
  | 'priority_asc'

const PRIORITY_RANK: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

export function sortTodoRows<T extends PrismaTodo>(rows: T[], sort: TodoSort): T[] {
  const copy = [...rows] as T[]

  switch (sort) {
    case 'createdAt_desc':
      return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    case 'createdAt_asc':
      return copy.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    case 'dueDate_asc':
      return copy.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return b.createdAt.getTime() - a.createdAt.getTime()
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        const d = a.dueDate.getTime() - b.dueDate.getTime()
        return d !== 0 ? d : b.createdAt.getTime() - a.createdAt.getTime()
      })
    case 'dueDate_desc':
      return copy.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return b.createdAt.getTime() - a.createdAt.getTime()
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        const d = b.dueDate.getTime() - a.dueDate.getTime()
        return d !== 0 ? d : b.createdAt.getTime() - a.createdAt.getTime()
      })
    case 'priority_desc':
      return copy.sort(
        (a, b) =>
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
          b.createdAt.getTime() - a.createdAt.getTime(),
      )
    case 'priority_asc':
      return copy.sort(
        (a, b) =>
          PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] ||
          b.createdAt.getTime() - a.createdAt.getTime(),
      )
    default:
      return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
}
