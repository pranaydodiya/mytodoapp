import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Category } from '@/types/todo'

export async function GET() {
  const rows = await prisma.category.findMany({ orderBy: { id: 'asc' } })
  const data: Category[] = rows.map(c => ({
    id: c.id,
    name: c.name,
    color: c.color,
  }))
  return NextResponse.json(data, { status: 200 })
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name: string =
    body && typeof body === 'object' && 'name' in body && typeof (body as { name: unknown }).name === 'string'
      ? (body as { name: string }).name.trim()
      : ''

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const rawColor =
    body && typeof body === 'object' && 'color' in body
      ? (body as { color: unknown }).color
      : undefined
  const color =
    typeof rawColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(rawColor)
      ? rawColor
      : '#6b7280'

  const created = await prisma.category.create({
    data: { name, color },
  })

  const newCategory: Category = {
    id: created.id,
    name: created.name,
    color: created.color,
  }

  return NextResponse.json(newCategory, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('id'))

  if (!id) {
    return NextResponse.json({ error: 'id query param is required' }, { status: 400 })
  }

  try {
    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ message: 'Category deleted' }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }
}
