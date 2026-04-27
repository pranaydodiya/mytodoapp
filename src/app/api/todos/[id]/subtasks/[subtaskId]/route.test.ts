import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it } from 'vitest'
import { prisma } from '@/lib/prisma'
import { DELETE, PATCH } from './route'

describe('/api/todos/[id]/subtasks/[subtaskId]', () => {
  afterEach(async () => {
    await prisma.subtask.deleteMany()
    await prisma.todo.deleteMany()
  })

  it('PATCH toggles completed and returns parent', async () => {
    const todo = await prisma.todo.create({
      data: {
        text: 'T',
        subtasks: { create: [{ text: 'S', position: 0 }] },
      },
      include: { subtasks: true },
    })
    const sid = todo.subtasks[0]!.id
    const res = await PATCH(
      new NextRequest('http://localhost/api/todos/1/subtasks/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      }),
      { params: Promise.resolve({ id: String(todo.id), subtaskId: String(sid) }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.todo.subtasks[0].completed).toBe(true)
  })

  it('DELETE removes subtask and compacts positions', async () => {
    const todo = await prisma.todo.create({
      data: {
        text: 'T',
        subtasks: {
          create: [
            { text: 'a', position: 0 },
            { text: 'b', position: 1 },
          ],
        },
      },
      include: { subtasks: true },
    })
    const [a, b] = todo.subtasks
    const res = await DELETE(new NextRequest('http://localhost/api/todos/1/subtasks/1'), {
      params: Promise.resolve({ id: String(todo.id), subtaskId: String(a!.id) }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.todo.subtasks).toHaveLength(1)
    expect(body.todo.subtasks[0].text).toBe('b')
    expect(body.todo.subtasks[0].position).toBe(0)
    const only = await prisma.subtask.findUnique({ where: { id: b!.id } })
    expect(only?.position).toBe(0)
  })
})
