import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it } from 'vitest'
import { prisma } from '@/lib/prisma'
import { POST } from './route'

describe('/api/todos/[id]/duplicate', () => {
  afterEach(async () => {
    await prisma.subtask.deleteMany()
    await prisma.todo.deleteMany()
  })

  it('creates a copy with completed false', async () => {
    const todo = await prisma.todo.create({
      data: {
        text: 'Original',
        completed: true,
        priority: 'high',
      },
    })
    const res = await POST(new NextRequest('http://localhost/api/todos/1/duplicate'), {
      params: Promise.resolve({ id: String(todo.id) }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.text).toBe('Original')
    expect(body.priority).toBe('high')
    expect(body.completed).toBe(false)
    expect(body.id).not.toBe(todo.id)
    expect(await prisma.todo.count()).toBe(2)
  })

  it('copies subtasks to the new todo', async () => {
    const todo = await prisma.todo.create({
      data: {
        text: 'Parent',
        completed: false,
        priority: 'medium',
        subtasks: {
          create: [
            { text: 'Step A', position: 0, completed: false },
            { text: 'Step B', position: 1, completed: true },
          ],
        },
      },
    })
    const res = await POST(new NextRequest('http://localhost/api/todos/1/duplicate'), {
      params: Promise.resolve({ id: String(todo.id) }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.subtasks).toHaveLength(2)
    expect(body.subtasks.map((s: { text: string }) => s.text)).toEqual(['Step A', 'Step B'])
    expect(body.subtasks[1].completed).toBe(true)
  })
})
