import { NextRequest, NextResponse } from 'next/server'
import { jsonError, parseJsonBody, parseQueryParams } from '@/lib/api-response'
import { categoryDeleteQuerySchema, categoryPostBodySchema } from '@/lib/api-schemas'
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
  const parsed = await parseJsonBody(request, categoryPostBodySchema)
  if (!parsed.ok) return parsed.response

  const { name, color } = parsed.data
  const colorResolved = color ?? '#6b7280'

  const created = await prisma.category.create({
    data: { name, color: colorResolved },
  })

  const newCategory: Category = {
    id: created.id,
    name: created.name,
    color: created.color,
  }

  return NextResponse.json(newCategory, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const qp = parseQueryParams(request.nextUrl.searchParams, categoryDeleteQuerySchema)
  if (!qp.ok) return qp.response

  const { id } = qp.data

  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) {
    return jsonError('Category not found', 404, { code: 'NOT_FOUND' })
  }

  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ message: 'Category deleted' }, { status: 200 })
}
