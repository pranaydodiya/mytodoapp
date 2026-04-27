import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { jsonError, parseJsonBody, parseQueryParams } from '@/lib/api-response'
import { todosGetQuerySchema, todosPostBodySchema } from '@/lib/api-schemas'
import { prisma } from '@/lib/prisma'
import { todoToDto } from '@/lib/todo-mappers'
import { utcDayBounds } from '@/lib/todo-due-bounds'
import { sortTodoRows, type TodoSort } from '@/lib/todo-sort'

export async function GET(request: NextRequest) {
  const query = parseQueryParams(request.nextUrl.searchParams, todosGetQuerySchema)
  if (!query.ok) return query.response

  const {
    search,
    completed,
    priority,
    categoryId: categoryIdRaw,
    sort: sortRaw,
    due: duePreset,
    includeSubtasks,
  } = query.data
  const sort: TodoSort = sortRaw ?? 'createdAt_desc'
  const subtaskInclude = includeSubtasks
    ? { subtasks: { orderBy: { position: 'asc' as const } } }
    : undefined

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

  if (duePreset === 'today') {
    const { start, end } = utcDayBounds()
    where.dueDate = { gte: start, lte: end }
  } else if (duePreset === 'overdue') {
    const { start } = utcDayBounds()
    where.completed = false
    where.dueDate = { not: null, lt: start }
  } else if (duePreset === 'no_due') {
    where.dueDate = null
  }

  const prioritySort = sort === 'priority_desc' || sort === 'priority_asc'

  const baseFind = { where, ...(subtaskInclude ? { include: subtaskInclude } : {}) }

  const rows = prioritySort
    ? sortTodoRows(await prisma.todo.findMany(baseFind), sort)
    : await prisma.todo.findMany({
        ...baseFind,
        orderBy:
          sort === 'createdAt_asc'
            ? { createdAt: 'asc' }
            : sort === 'dueDate_asc'
              ? [{ dueDate: 'asc' }, { createdAt: 'desc' }]
              : sort === 'dueDate_desc'
                ? [{ dueDate: 'desc' }, { createdAt: 'desc' }]
                : { createdAt: 'desc' },
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
    include: { subtasks: { orderBy: { position: 'asc' } } },
  })

  return NextResponse.json(todoToDto(row), { status: 201 })
}
