import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { jsonError, parseJsonBody, parseQueryParams } from '@/lib/api-response'
import { todosGetQuerySchema, todosPostBodySchema } from '@/lib/api-schemas'
import { prisma } from '@/lib/prisma'
import { todoToDto } from '@/lib/todo-mappers'
import { sortTodoRows, type TodoSort } from '@/lib/todo-sort'

export async function GET(request: NextRequest) {
  const query = parseQueryParams(request.nextUrl.searchParams, todosGetQuerySchema)
  if (!query.ok) return query.response

  const { search, completed, priority, categoryId: categoryIdRaw, sort: sortRaw } =
    query.data
  const sort: TodoSort = sortRaw ?? 'createdAt_desc'

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

  const prioritySort = sort === 'priority_desc' || sort === 'priority_asc'

  const rows = prioritySort
// Current (verbose):
  const prioritySort = sort === 'priority_desc' || sort === 'priority_asc'

  const rows = prioritySort
    ? sortTodoRows(await prisma.todo.findMany({ where }), sort)
    : await prisma.todo.findMany({
        where,
        orderBy:
          sort === 'createdAt_asc'
            ? { createdAt: 'asc' }
            : sort === 'dueDate_asc'
              ? [{ dueDate: 'asc' }, { createdAt: 'desc' }]
              : sort === 'dueDate_desc'
                ? [{ dueDate: 'desc' }, { createdAt: 'desc' }]
// Current (verbose):
  const rows = prioritySort
    ? sortTodoRows(await prisma.todo.findMany({ where }), sort)
    : await prisma.todo.findMany({
        where,
        orderBy:
          sort === 'createdAt_asc'
            ? { createdAt: 'asc' }
            : sort === 'dueDate_asc'
              ? [{ dueDate: 'asc' }, { createdAt: 'desc' }]
              : sort === 'dueDate_desc'
                ? [{ dueDate: 'desc' }, { createdAt: 'desc' }]
                : { createdAt: 'desc' },
      })

  // ✨ Compact/optimized:
  let orderBy: Prisma.TodoOrderByWithRelationInput | Prisma.TodoOrderByWithRelationInput[] = {

## 🐛 Bugs

### 🔵 Low
- **`src/app/api/todos/route.ts:36-50`** — Potential performance bottleneck for large datasets
  The API performs client-side sorting for `priority_desc` and `priority_asc` by fetching all todos and then sorting them in memory. For a small number of todos, this is acceptable, but for very large datasets, it would be more efficient to leverage the database's sorting capabilities. While Prisma's `orderBy` might not directly support custom enum order, it could be achieved with a raw query or by adding a numeric priority field to the database.
      })

  // ✨ Compact/optimized:
  // Consider mapping priority to an integer in the database or using Prisma's `orderByRaw`
  // if the database supports custom sorting logic for enums or if a custom ranking
  // can be applied at the DB level.
  // Example (conceptual, requires DB schema change or raw query):
  // If priority was an integer: orderBy: { priority: sort === 'priority_asc' ? 'asc' : 'desc' }
  // If using orderByRaw (DB specific, e.g., PostgreSQL):
  // orderBy: Prisma.sql`CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END ${sort === 'priority_asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`}`

  // If in-memory sort is unavoidable for custom priority ranking, ensure `where` clauses
  // are as restrictive as possible to minimize the number of rows fetched.
  // For now, no direct compact rewrite without changing the database schema or using raw queries.
  // The current approach is acceptable for small to medium datasets.
    : await prisma.todo.findMany({
        where,
        orderBy:
          sort === 'createdAt_asc'
            ? { createdAt: 'asc' }
            : sort === 'dueDate_asc'
              ? [{ dueDate: 'asc' }, { createdAt: 'desc' }]
              : sort === 'dueDate_desc'
                ? [{ dueDate: 'desc' }, { createdAt: 'desc' }]
                : { createdAt: 'desc' },
// Fix: Consider database-level sorting for priority for better performance with large datasets.
  // Example (conceptual, requires schema/DB changes or raw query):
  // In Prisma schema:
  // enum Priority {
  //   high @map(0)
  //   medium @map(1)
  //   low @map(2)
  // }
  // Or:
  // model Todo {
  //   // ...
  //   priority      Priority
  //   priorityRank  Int @default(1) // Add a numeric rank
  // }
  //
  // Then in route.ts:
  // const rows = await prisma.todo.findMany({
  //   where,
  //   orderBy:
  //     sort === 'priority_desc'
  //       ? { priorityRank: 'asc' } // Assuming 0=high, 1=medium, 2=low
  //       : sort === 'priority_asc'
  //         ? { priorityRank: 'desc' }
  //         : // ... other sorts
  // });

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
