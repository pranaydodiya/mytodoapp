import { NextRequest, NextResponse } from 'next/server'
import { jsonError, parseJsonBody } from '@/lib/api-response'
import { subtaskPatchBodySchema } from '@/lib/api-schemas'
import { prisma } from '@/lib/prisma'
import { moveSubtaskToIndex, assertSubtaskBelongs, compactSubtaskPositions } from '@/lib/subtask-helpers'
import { todoToDto } from '@/lib/todo-mappers'

type RouteContext = { params: Promise<{ id: string; subtaskId: string }> }

function parseId(raw: string): number | null {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1) return null
  return n
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: idParam, subtaskId: sidParam } = await context.params
  const todoId = parseId(idParam)
  const subtaskId = parseId(sidParam)
  if (todoId === null || subtaskId === null) {
    return jsonError('Invalid id', 400, { code: 'INVALID_ID' })
  }

  const parsed = await parseJsonBody(request, subtaskPatchBodySchema)
  if (!parsed.ok) return parsed.response

  const body = parsed.data
  const existing = await assertSubtaskBelongs(subtaskId, todoId)
  if (!existing) {
    return jsonError('Subtask not found', 404, { code: 'NOT_FOUND' })
  }

  if (body.position !== undefined) {
    await moveSubtaskToIndex(todoId, subtaskId, body.position)
  }

  const data: { text?: string; completed?: boolean } = {}
  if (body.text !== undefined) data.text = body.text
  if (body.completed !== undefined) data.completed = body.completed

  if (Object.keys(data).length > 0) {
    await prisma.subtask.update({
      where: { id: subtaskId },
      data,
    })
  }

  const withSubs = await prisma.todo.findUniqueOrThrow({
    where: { id: todoId },
    include: { subtasks: { orderBy: { position: 'asc' } } },
  })

  return NextResponse.json({ todo: todoToDto(withSubs) })
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id: idParam, subtaskId: sidParam } = await context.params
  const todoId = parseId(idParam)
  const subtaskId = parseId(sidParam)
  if (todoId === null || subtaskId === null) {
    return jsonError('Invalid id', 400, { code: 'INVALID_ID' })
  }

  const existing = await assertSubtaskBelongs(subtaskId, todoId)
  if (!existing) {
    return jsonError('Subtask not found', 404, { code: 'NOT_FOUND' })
  }

  await prisma.subtask.delete({ where: { id: subtaskId } })
  await compactSubtaskPositions(todoId)

  const withSubs = await prisma.todo.findUniqueOrThrow({
    where: { id: todoId },
    include: { subtasks: { orderBy: { position: 'asc' } } },
  })

  return NextResponse.json({ todo: todoToDto(withSubs) })
}
