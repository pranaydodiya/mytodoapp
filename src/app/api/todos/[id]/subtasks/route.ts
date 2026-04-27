import { NextRequest, NextResponse } from 'next/server'
import { jsonError, parseJsonBody } from '@/lib/api-response'
import { subtaskPostBodySchema } from '@/lib/api-schemas'
import { prisma } from '@/lib/prisma'
import { subtaskToDto } from '@/lib/subtask-mappers'
import { assertTodoExists, getNextSubtaskPosition, moveSubtaskToIndex } from '@/lib/subtask-helpers'
import { todoToDto } from '@/lib/todo-mappers'

type RouteContext = { params: Promise<{ id: string }> }

function parseId(raw: string): number | null {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1) return null
  return n
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id: idParam } = await context.params
  const todoId = parseId(idParam)
  if (todoId === null) {
    return jsonError('Invalid id', 400, { code: 'INVALID_ID' })
  }

  const parent = await assertTodoExists(todoId)
  if (!parent) {
    return jsonError('Todo not found', 404, { code: 'NOT_FOUND' })
  }

  const rows = await prisma.subtask.findMany({
    where: { todoId },
    orderBy: { position: 'asc' },
  })

  return NextResponse.json(rows.map(subtaskToDto))
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: idParam } = await context.params
  const todoId = parseId(idParam)
  if (todoId === null) {
    return jsonError('Invalid id', 400, { code: 'INVALID_ID' })
  }

  const parent = await assertTodoExists(todoId)
  if (!parent) {
    return jsonError('Todo not found', 404, { code: 'NOT_FOUND' })
  }

  const parsed = await parseJsonBody(request, subtaskPostBodySchema)
  if (!parsed.ok) return parsed.response

  const { text, position: desiredIndex } = parsed.data
  const nextPos = await getNextSubtaskPosition(todoId)

  const created = await prisma.subtask.create({
    data: { todoId, text, position: nextPos },
  })

  if (desiredIndex !== undefined) {
    const count = await prisma.subtask.count({ where: { todoId } })
    const cap = Math.max(0, count - 1)
    const idx = Math.min(desiredIndex, cap)
    await moveSubtaskToIndex(todoId, created.id, idx)
  }

  const withSubs = await prisma.todo.findUniqueOrThrow({
    where: { id: todoId },
    include: { subtasks: { orderBy: { position: 'asc' } } },
  })

  return NextResponse.json({ todo: todoToDto(withSubs) }, { status: 201 })
}
