import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { jsonError, parseJsonBody, parseQueryParams } from '@/lib/api-response'
import { todosGetQuerySchema, todosPostBodySchema } from '@/lib/api-schemas'
import { prisma } from '@/lib/prisma'
import { todoToDto } from '@/lib/todo-mappers'

export async function GET(request: NextRequest) {
  const query = parseQueryParams(request.nextUrl.searchParams, todosGetQuerySchema)
  if (!query.ok) return query.response

  const { search, completed, priority, categoryId: categoryIdRaw } = query.data

  const where: Prisma.TodoWhereInput = {}

  if (search) {
    where.text = { contains: search }
  }
  if (completed === 'true') {
    where.completed = true
  } else if (completed === 'false') {
    where.completed = false
  }
  if (priority) {
    where.priority = priority
  }
  if (categoryIdRaw === 'null') {
    where.categoryId = null
  } else if (categoryIdRaw !== undefined) {
    where.categoryId = Number(categoryIdRaw)
  }

  const rows = await prisma.todo.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(rows.map(todoToDto))
}

export async function POST(request: NextRequest) {
  const parsed = await parseJsonBody(request, todosPostBodySchema)
  if (!parsed.ok) return parsed.response

  const { text, priority, categoryId, dueDate } = parsed.data
  const categoryIdForDb = categoryId === undefined ? null : categoryId

  if (categoryIdForDb !== null) {
    const cat = await prisma.category.findUnique({ where: { id: categoryIdForDb } })
    if (!cat) {
      return jsonError('Category not found', 400, { code: 'CATEGORY_NOT_FOUND' })
    }
  }

  const row = await prisma.todo.create({
    data: {
      text,
      priority,
      categoryId: categoryIdForDb,
      ...(dueDate !== undefined
        ? { dueDate: new Date(`${dueDate}T12:00:00.000Z`) }
        : {}),
    },
  })

  return NextResponse.json(todoToDto(row), { status: 201 })
}
