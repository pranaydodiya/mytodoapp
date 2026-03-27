import { NextRequest, NextResponse } from 'next/server'
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
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body must be an object' }, { status: 400 })
  }

  const completed = (body as { completed?: unknown }).completed
  if (typeof completed !== 'boolean') {
    return NextResponse.json({ error: 'completed boolean is required' }, { status: 400 })
  }

  const existing = await prisma.todo.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
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
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const existing = await prisma.todo.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
  }

  await prisma.todo.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
