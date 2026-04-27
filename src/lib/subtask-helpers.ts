import { prisma } from '@/lib/prisma'

/** Next append position (max + 1, or 0 if no rows). */
export async function getNextSubtaskPosition(todoId: number): Promise<number> {
  const agg = await prisma.subtask.aggregate({
    where: { todoId },
    _max: { position: true },
  })
  const max = agg._max.position
  if (max === null) return 0
  return max + 1
}

/** Move one subtask to a 0-based index and renumber siblings. */
export async function moveSubtaskToIndex(
  todoId: number,
  subtaskId: number,
  newIndex: number,
): Promise<void> {
  const subtasks = await prisma.subtask.findMany({
    where: { todoId },
    orderBy: { position: 'asc' },
  })
  const ids = subtasks.map(s => s.id)
  const from = ids.indexOf(subtaskId)
  if (from < 0) {
    return
  }
  const n = ids.length
  if (n === 0) {
    return
  }
  const clamped = Math.max(0, Math.min(newIndex, n - 1))
  const reordered = [...ids]
  const [removed] = reordered.splice(from, 1)
  reordered.splice(clamped, 0, removed)
  await prisma.$transaction(
    reordered.map((id, position) =>
      prisma.subtask.update({ where: { id }, data: { position } }),
    ),
  )
}

export async function assertTodoExists(todoId: number) {
  return prisma.todo.findUnique({ where: { id: todoId } })
}

export async function assertSubtaskBelongs(
  subtaskId: number,
  todoId: number,
) {
  return prisma.subtask.findFirst({
    where: { id: subtaskId, todoId },
  })
}

/** After a delete, renumber 0..n-1. */
export async function compactSubtaskPositions(todoId: number): Promise<void> {
  const list = await prisma.subtask.findMany({
    where: { todoId },
    orderBy: { position: 'asc' },
  })
  await prisma.$transaction(
    list.map((s, i) =>
      prisma.subtask.update({
        where: { id: s.id },
        data: { position: i },
      }),
    ),
  )
}
