import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Priority } from '@/types/todo'

export async function GET() {
  const [todos, categories] = await Promise.all([
    prisma.todo.findMany(),
    prisma.category.findMany({ orderBy: { id: 'asc' } }),
  ])

  const now = new Date()

  const total = todos.length
  const completed = todos.filter(t => t.completed).length
  const pending = todos.filter(t => !t.completed).length
  const overdue = todos.filter(t => {
    if (t.completed || !t.dueDate) return false
    return t.dueDate < now
  }).length

  const byPriority: Record<Priority, number> = {
    low: todos.filter(t => t.priority === 'low').length,
    medium: todos.filter(t => t.priority === 'medium').length,
    high: todos.filter(t => t.priority === 'high').length,
  }

  const byCategory = [
    {
      categoryId: null as number | null,
      name: 'Uncategorized',
      color: undefined as string | undefined,
      count: todos.filter(t => t.categoryId === null).length,
    },
    ...categories.map(c => ({
      categoryId: c.id,
      name: c.name,
      color: c.color,
      count: todos.filter(t => t.categoryId === c.id).length,
    })),
  ]

  return NextResponse.json(
    { total, completed, pending, overdue, byPriority, byCategory },
    { status: 200 },
  )
}
