import type { Subtask as PrismaSubtask } from '@prisma/client'
import type { Subtask } from '@/types/todo'

export function subtaskToDto(row: PrismaSubtask): Subtask {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
  }
}
