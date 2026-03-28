import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE() {
  const result = await prisma.todo.deleteMany({ where: { completed: true } })
  return NextResponse.json({ deleted: result.count })
}
