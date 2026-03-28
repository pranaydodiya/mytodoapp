import { afterEach, describe, expect, it } from 'vitest'
import { prisma } from '@/lib/prisma'
import { GET } from './route'

describe('/api/stats', () => {
  afterEach(async () => {
    await prisma.todo.deleteMany()
    await prisma.category.deleteMany()
  })

  it('returns aggregates', async () => {
    const cat = await prisma.category.create({
      data: { name: 'Work', color: '#3b82f6' },
    })
    const past = new Date('2020-01-01T00:00:00.000Z')
    await prisma.todo.createMany({
      data: [
        {
          text: 'done',
          completed: true,
          priority: 'low',
          categoryId: cat.id,
        },
        {
          text: 'open',
          completed: false,
          priority: 'high',
          categoryId: null,
          dueDate: past,
        },
      ],
    })

    const res = await GET()
    expect(res.status).toBe(200)
    const s = await res.json()
    expect(s.total).toBe(2)
    expect(s.completed).toBe(1)
    expect(s.pending).toBe(1)
    expect(s.overdue).toBe(1)
    expect(s.byPriority.low).toBe(1)
    expect(s.byPriority.high).toBe(1)
    expect(s.byCategory.find((c: { categoryId: number | null }) => c.categoryId === null).count).toBe(
      1,
    )
    expect(s.byCategory.find((c: { categoryId: number }) => c.categoryId === cat.id).count).toBe(1)
  })
})
