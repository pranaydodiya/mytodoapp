import type { Todo as PrismaTodo } from '@prisma/client'
import type { Todo } from '@/types/todo'

function dateToYyyyMmDd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function todoToDto(row: PrismaTodo): Todo {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed,
    priority: row.priority,
    categoryId: row.categoryId,
    dueDate: row.dueDate ? dateToYyyyMmDd(row.dueDate) : null,
    createdAt: row.createdAt.toISOString(),
  }
}
