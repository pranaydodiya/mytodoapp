import { afterEach, describe, expect, it } from 'vitest'
import { prisma } from '@/lib/prisma'
import { POST } from './route'

describe('/api/todos/complete-all', () => {
  afterEach(async () => {
    await prisma.todo.deleteMany()
  })

  it('marks all pending todos completed', async () => {
    await prisma.todo.createMany({
      data: [
        { text: 'a', completed: false, priority: 'low' },
        { text: 'b', completed: true, priority: 'low' },
        { text: 'c', completed: false, priority: 'high' },
      ],
    })
    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.updated).toBe(2)
    const open = await prisma.todo.count({ where: { completed: false } })
    expect(open).toBe(0)
  })
})
