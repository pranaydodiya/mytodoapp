import { NextResponse } from 'next/server'
import { jsonError } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { todoToDto } from '@/lib/todo-mappers'

type RouteContext = { params: Promise<{ id: string }> }

function parseId(raw: string): number | null {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1) return null
  return n
}

export async function POST(_request: Request, context: RouteContext) {
  const { id: idParam } = await context.params
  const id = parseId(idParam)
  if (id === null) {
    return jsonError('Invalid id', 400, { code: 'INVALID_ID' })
  }

  const existing = await prisma.todo.findUnique({ where: { id } })
  if (!existing) {
    return jsonError('Todo not found', 404, { code: 'NOT_FOUND' })
  }

  const row = await prisma.todo.create({
    data: {
      text: existing.text,
      priority: existing.priority,
      categoryId: existing.categoryId,
      dueDate: existing.dueDate,
      completed: false,
    },
  })

  return NextResponse.json(todoToDto(row), { status: 201 })
}
