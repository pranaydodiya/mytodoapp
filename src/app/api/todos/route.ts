import { NextRequest, NextResponse } from 'next/server'
import { todoRepository } from '@/lib/todoRepository'
import type { Priority } from '@/types/todo'

function parseBoolean(value: string | null): boolean | undefined {
  if (value === null) return undefined
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

function parsePriority(value: string | null): Priority | undefined {
  if (value === 'low' || value === 'medium' || value === 'high') {
    return value
  }
  return undefined
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const search = searchParams.get('search') ?? undefined
  const completed = parseBoolean(searchParams.get('completed'))
  const priority = parsePriority(searchParams.get('priority'))

  const categoryParam = searchParams.get('categoryId')
  let categoryId: number | null | undefined
  if (categoryParam === 'null') {
    categoryId = null
  } else if (categoryParam !== null) {
    const parsed = Number(categoryParam)
    if (!Number.isNaN(parsed)) {
      categoryId = parsed
    }
  }

  const todos = todoRepository.list({
    search,
    completed,
    priority,
    categoryId,
  })

  return NextResponse.json(todos, { status: 200 })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body.text !== 'string' || !body.text.trim()) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  const text = body.text.trim()

  const priority = parsePriority(body.priority ?? null) ?? 'medium'

  let categoryId: number | null | undefined
  if (body.categoryId === null) {
    categoryId = null
  } else if (typeof body.categoryId === 'number') {
    categoryId = body.categoryId
  }

  let dueDate: string | null | undefined
  if (body.dueDate === null) {
    dueDate = null
  } else if (typeof body.dueDate === 'string' && body.dueDate.trim()) {
    const d = new Date(body.dueDate)
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: 'dueDate must be a valid date' }, { status: 400 })
    }
    dueDate = body.dueDate
  }

  const todo = todoRepository.create({
    text,
    priority,
    categoryId,
    dueDate,
  })

  return NextResponse.json(todo, { status: 201 })
}

