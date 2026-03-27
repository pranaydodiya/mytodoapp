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

  const { completed } = parsed.data

  const existing = await prisma.todo.findUnique({ where: { id } })
  if (!existing) {
    return jsonError('Todo not found', 404, { code: 'NOT_FOUND' })
  }

  const row = await prisma.todo.update({
    where: { id },
    data: { completed },
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
