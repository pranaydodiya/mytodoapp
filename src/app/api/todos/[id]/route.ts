import type { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { jsonError, parseJsonBody } from '@/lib/api-response'
import { todoPatchBodySchema } from '@/lib/api-schemas'
import { prisma } from '@/lib/prisma'
import { todoToDto } from '@/lib/todo-mappers'

type RouteContext = { params: Promise<{ id: string }> }

function parseId(raw: string): number | null {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1) return null
  return n
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: idParam } = await context.params
  const id = parseId(idParam)
  if (id === null) {
    return jsonError('Invalid id', 400, { code: 'INVALID_ID' })
  }

  const parsed = await parseJsonBody(request, todoPatchBodySchema)
  if (!parsed.ok) return parsed.response

  const body = parsed.data

  const existing = await prisma.todo.findUnique({ where: { id } })
  if (!existing) {
    return jsonError('Todo not found', 404, { code: 'NOT_FOUND' })
  }

  if (body.categoryId !== undefined && body.categoryId !== null) {
    const cat = await prisma.category.findUnique({ where: { id: body.categoryId } })
    if (!cat) {
      return jsonError('Category not found', 400, { code: 'CATEGORY_NOT_FOUND' })
    }
  }

  const data: Prisma.TodoUncheckedUpdateInput = {}
  if (body.completed !== undefined) data.completed = body.completed
  if (body.text !== undefined) data.text = body.text
  if (body.priority !== undefined) data.priority = body.priority
  if (body.categoryId !== undefined) {
    data.categoryId = body.categoryId
  }
  if (body.dueDate !== undefined) {
    data.dueDate =
      body.dueDate === null
        ? null
        : new Date(`${body.dueDate}T12:00:00.000Z`)
  }

  const row = await prisma.todo.update({
    where: { id },
    data,
    include: { subtasks: { orderBy: { position: 'asc' } } },
  })
  return NextResponse.json(todoToDto(row))
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id: idParam } = await context.params
  const id = parseId(idParam)
  if (id === null) {
    return jsonError('Invalid id', 400, { code: 'INVALID_ID' })
  }

  const existing = await prisma.todo.findUnique({ where: { id } })
  if (!existing) {
    return jsonError('Todo not found', 404, { code: 'NOT_FOUND' })
  }

  await prisma.todo.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
