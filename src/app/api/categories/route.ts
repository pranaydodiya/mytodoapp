import { NextRequest, NextResponse } from 'next/server'
import { categories } from '@/lib/store'
import { Category } from '@/types/todo'

export async function GET() {
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

  categories.push(newCategory)
  return NextResponse.json(newCategory, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('id'))

  if (!id) {
    return NextResponse.json({ error: 'id query param is required' }, { status: 400 })
  }

  const index = categories.findIndex(c => c.id === id)
  if (index === -1) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  categories.splice(index, 1)
  return NextResponse.json({ message: 'Category deleted' }, { status: 200 })
}
