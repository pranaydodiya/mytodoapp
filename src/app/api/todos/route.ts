import { NextRequest, NextResponse } from 'next/server'

interface Todo {
  id: number
  text: string
  completed: boolean
}

// In-memory store (resets on server restart; replace with a DB for persistence)
let todos: Todo[] = []

// GET /api/todos — return all todos
export async function GET() {
  return NextResponse.json(todos, { status: 200 })
}

// POST /api/todos — create a new todo
export async function POST(request: NextRequest) {
  const body = await request.json()
  const text: string = body?.text?.trim()

  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  const newTodo: Todo = {
    id: Date.now(),
    text,
    completed: false,
  }

  todos.push(newTodo)
  return NextResponse.json(newTodo, { status: 201 })
}

// PUT /api/todos — update a todo (toggle completed or edit text)
export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, text, completed } = body

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const index = todos.findIndex((todo) => todo.id === id)
  if (index === -1) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
  }

  todos[index] = {
    ...todos[index],
    ...(text !== undefined && { text: String(text).trim() }),
    ...(completed !== undefined && { completed: Boolean(completed) }),
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

  const index = todos.findIndex((todo) => todo.id === id)
  if (index === -1) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
  }

  todos.splice(index, 1)
  return NextResponse.json({ message: 'Todo deleted' }, { status: 200 })
}
