import { NextRequest, NextResponse } from 'next/server'
import { todoRepository } from '@/lib/todoRepository'
import type { Category } from '@/types/todo'

export async function GET() {
  const categories = todoRepository.getCategories()
  return NextResponse.json(categories, { status: 200 })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const name: string = body?.name?.trim()

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const newCategory: Category = {
    id: Date.now(),
    name,
    color: typeof body.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.color)
      ? body.color
      : '#6b7280',
  }

  todoRepository.addCategory(newCategory)
  return NextResponse.json(newCategory, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('id'))

  if (!id) {
    return NextResponse.json({ error: 'id query param is required' }, { status: 400 })
  }

  const deleted = todoRepository.deleteCategory(id)
  if (!deleted) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  return NextResponse.json({ message: 'Category deleted' }, { status: 200 })
}
