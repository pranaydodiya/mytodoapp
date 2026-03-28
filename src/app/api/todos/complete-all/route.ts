import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const result = await prisma.todo.updateMany({
    where: { completed: false },
    data: { completed: true },
  })
  return NextResponse.json({ updated: result.count })
}
