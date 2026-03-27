import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { todoToDto } from '@/lib/todo-mappers'
import type { Priority } from '@/types/todo'

const PRIORITIES: Priority[] = ['low', 'medium', 'high']

function isPriority(v: unknown): v is Priority {
  return typeof v === 'string' && PRIORITIES.includes(v as Priority)
}

function parseDueDate(value: unknown): Date | null | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string') return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const d = new Date(`${value}T12:00:00.000Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.trim()
  const completed = searchParams.get('completed')
  const priority = searchParams.get('priority')
  const categoryIdRaw = searchParams.get('categoryId')

  const where: Prisma.TodoWhereInput = {}

  if (search) {
    where.text = { contains: search }
  }
  if (completed === 'true') {
    where.completed = true
  } else if (completed === 'false') {
    where.completed = false
  }
  if (priority && isPriority(priority)) {
    where.priority = priority
  }
  if (categoryIdRaw === 'null') {
    where.categoryId = null
  } else if (categoryIdRaw !== null && categoryIdRaw !== '') {
    const id = Number(categoryIdRaw)
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: 'Invalid categoryId' }, { status: 400 })
    }
    where.categoryId = id
  }

  const rows = await prisma.todo.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(rows.map(todoToDto))
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body must be an object' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const text = typeof b.text === 'string' ? b.text.trim() : ''
  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  const priority: Priority = isPriority(b.priority) ? b.priority : 'medium'

  let categoryId: number | null = null
  if (b.categoryId === null) {
    categoryId = null
  } else if (b.categoryId === undefined) {
    categoryId = null
  } else if (typeof b.categoryId === 'number' && Number.isInteger(b.categoryId)) {
    categoryId = b.categoryId
  } else {
    return NextResponse.json({ error: 'categoryId must be a number or null' }, { status: 400 })
  }

  if (categoryId !== null) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!cat) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 })
    }
  }

  const dueParsed = parseDueDate(b.dueDate)
  if (dueParsed === null) {
    return NextResponse.json({ error: 'dueDate must be YYYY-MM-DD' }, { status: 400 })
  }

  const row = await prisma.todo.create({
    data: {
      text,
      priority,
      categoryId,
      ...(dueParsed !== undefined ? { dueDate: dueParsed } : {}),
    },
  })

  return NextResponse.json(todoToDto(row), { status: 201 })
}
