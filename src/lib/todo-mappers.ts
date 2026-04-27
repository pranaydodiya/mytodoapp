import type { Subtask as PrismaSubtask, Todo as PrismaTodo } from '@prisma/client'
import type { Todo } from '@/types/todo'
import { subtaskToDto } from '@/lib/subtask-mappers'

function dateToYyyyMmDd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function todoToDto(
  row: PrismaTodo & { subtasks?: PrismaSubtask[] },
): Todo {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed,
    priority: row.priority,
    categoryId: row.categoryId,
    dueDate: row.dueDate ? dateToYyyyMmDd(row.dueDate) : null,
    createdAt: row.createdAt.toISOString(),
    subtasks: row.subtasks
      ? row.subtasks
          .slice()
          .sort((a, b) => a.position - b.position)
          .map(subtaskToDto)
      : [],
  }
}
