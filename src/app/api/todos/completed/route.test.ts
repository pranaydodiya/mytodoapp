import { afterEach, describe, expect, it } from 'vitest'
import { prisma } from '@/lib/prisma'
import { DELETE } from './route'

describe('/api/todos/completed', () => {
  afterEach(async () => {
    await prisma.todo.deleteMany()
  })

  it('deletes only completed todos', async () => {
    await prisma.todo.createMany({
      data: [
        { text: 'done', completed: true, priority: 'medium' },
        { text: 'open', completed: false, priority: 'medium' },
      ],
    })
    const res = await DELETE()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.deleted).toBe(1)
    const remaining = await prisma.todo.findMany()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].text).toBe('open')
  })
})
