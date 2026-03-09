import { NextRequest, NextResponse } from 'next/server'
import { todos } from '@/lib/store'
import { Priority, Todo } from '@/types/todo'

const VALID_PRIORITIES: Priority[] = ['low', 'medium', 'high']

// GET /api/todos — return all todos, optional ?priority=&categoryId=&completed= filters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const priorityFilter = searchParams.get('priority') as Priority | null
  const categoryIdFilter = searchParams.get('categoryId')
  const completedFilter = searchParams.get('completed')

  let result = [...todos]

  if (priorityFilter && VALID_PRIORITIES.includes(priorityFilter)) {
    result = result.filter(t => t.priority === priorityFilter)
  }
  if (categoryIdFilter !== null) {
    const cid = categoryIdFilter === 'null' ? null : Number(categoryIdFilter)
    result = result.filter(t => t.categoryId === cid)
  }
  if (completedFilter !== null) {
    const done = completedFilter === 'true'
    result = result.filter(t => t.completed === done)
  }

  return NextResponse.json(result, { status: 200 })
}

// POST /api/todos — create a new todo
export async function POST(request: NextRequest) {
  const body = await request.json()
  const text: string = body?.text?.trim()

  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  const priority: Priority = VALID_PRIORITIES.includes(body.priority)
    ? body.priority
    : 'medium'

  const dueDate: string | null =
    typeof body.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)
      ? body.dueDate
      : null

  const newTodo: Todo = {
    id: Date.now(),
    text,
    completed: false,
    priority,
    categoryId: body.categoryId != null ? Number(body.categoryId) : null,
    dueDate,
    createdAt: new Date().toISOString(),
  }

  todos.push(newTodo)
  return NextResponse.json(newTodo, { status: 201 })
}

// PUT /api/todos — update a todo
export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, text, completed, priority, categoryId, dueDate } = body

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const index = todos.findIndex(t => t.id === id)
  if (index === -1) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
  }

  todos[index] = {
    ...todos[index],
    ...(text !== undefined && { text: String(text).trim() }),
    ...(completed !== undefined && { completed: Boolean(completed) }),
    ...(priority !== undefined && VALID_PRIORITIES.includes(priority) && { priority }),
    ...(categoryId !== undefined && { categoryId: categoryId === null ? null : Number(categoryId) }),
    ...(dueDate !== undefined && {
      dueDate: dueDate === null ? null
        : /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? dueDate : todos[index].dueDate,
    }),
  }

  return NextResponse.json(todos[index], { status: 200 })
}

// DELETE /api/todos — delete a todo by id
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('id'))

  if (!id) {
    return NextResponse.json({ error: 'id query param is required' }, { status: 400 })
  }

  const index = todos.findIndex(t => t.id === id)
  if (index === -1) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
  }

  todos.splice(index, 1)
  return NextResponse.json({ message: 'Todo deleted' }, { status: 200 })
}
