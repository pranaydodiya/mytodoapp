import { NextResponse } from 'next/server'
import { todos, categories } from '@/lib/store'

export async function GET() {
  const now = new Date()

  const total = todos.length
  const completed = todos.filter(t => t.completed).length
  const pending = todos.filter(t => !t.completed).length
  const overdue = todos.filter(
    t => !t.completed && t.dueDate !== null && new Date(t.dueDate) < now,
  ).length

  const byPriority = {
    low:    todos.filter(t => t.priority === 'low').length,
    medium: todos.filter(t => t.priority === 'medium').length,
    high:   todos.filter(t => t.priority === 'high').length,
  }

  const byCategory = [
    {
      categoryId: null,
      name: 'Uncategorized',
      color: undefined,
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
