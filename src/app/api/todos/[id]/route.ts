import { NextRequest, NextResponse } from 'next/server'
import { todoRepository } from '@/lib/todoRepository'
import type { Priority } from '@/types/todo'

function parsePriority(value: unknown): Priority | undefined {
  if (value === 'low' || value === 'medium' || value === 'high') {
    return value
  }
  return undefined
}

interface RouteParams {
  params: { id: string }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const id = Number(params.id)
  if (!id) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const todo = todoRepository.getById(id)
  if (!todo) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
  }

  return NextResponse.json(todo, { status: 200 })
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const id = Number(params.id)
  if (!id) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const existing = todoRepository.getById(id)
  if (!existing) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const update: {
    text?: string
    completed?: boolean
    priority?: Priority
    categoryId?: number | null
    dueDate?: string | null
  } = {}

  if (typeof body.text === 'string') {
    const text = body.text.trim()
    if (!text) {
      return NextResponse.json({ error: 'text cannot be empty' }, { status: 400 })
    }
    update.text = text
  }

  if (typeof body.completed === 'boolean') {
    update.completed = body.completed
  }

  const priority = parsePriority(body.priority)
  if (body.priority !== undefined && !priority) {
    return NextResponse.json({ error: 'priority must be low, medium, or high' }, { status: 400 })
  }
  if (priority) {
    update.priority = priority
  }

  if (Object.prototype.hasOwnProperty.call(body, 'categoryId')) {
    if (body.categoryId === null) {
      update.categoryId = null
    } else if (typeof body.categoryId === 'number') {
      update.categoryId = body.categoryId
    } else {
      return NextResponse.json({ error: 'categoryId must be a number or null' }, { status: 400 })
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'dueDate')) {
    if (body.dueDate === null) {
      update.dueDate = null
    } else if (typeof body.dueDate === 'string' && body.dueDate.trim()) {
      const d = new Date(body.dueDate)
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: 'dueDate must be a valid date' }, { status: 400 })
      }
      update.dueDate = body.dueDate
    } else {
      return NextResponse.json({ error: 'dueDate must be a string or null' }, { status: 400 })
    }
  }

  const updated = todoRepository.update(id, update)
  if (!updated) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
  }

  return NextResponse.json(updated, { status: 200 })
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const id = Number(params.id)
  if (!id) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const deleted = todoRepository.delete(id)
  if (!deleted) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
  }

  return NextResponse.json({ message: 'Todo deleted' }, { status: 200 })
}

