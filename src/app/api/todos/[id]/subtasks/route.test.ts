import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it } from 'vitest'
import { prisma } from '@/lib/prisma'
import { GET, POST } from './route'

describe('/api/todos/[id]/subtasks', () => {
  afterEach(async () => {
    await prisma.subtask.deleteMany()
    await prisma.todo.deleteMany()
  })

  it('GET returns ordered subtasks', async () => {
    const todo = await prisma.todo.create({
      data: {
        text: 'T',
        subtasks: {
          create: [
            { text: 'second', position: 1 },
            { text: 'first', position: 0 },
          ],
        },
      },
    })
    const res = await GET(new NextRequest('http://localhost/api/todos/1/subtasks'), {
      params: Promise.resolve({ id: String(todo.id) }),
    })
    expect(res.status).toBe(200)
    const rows = await res.json()
    expect(rows.map((r: { text: string }) => r.text)).toEqual(['first', 'second'])
  })

  it('POST appends a subtask and returns parent todo', async () => {
    const todo = await prisma.todo.create({ data: { text: 'T' } })
    const res = await POST(
      new NextRequest('http://localhost/api/todos/1/subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '  Item  ' }),
      }),
      { params: Promise.resolve({ id: String(todo.id) }) },
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.todo.subtasks).toHaveLength(1)
    expect(body.todo.subtasks[0].text).toBe('Item')
    expect(body.todo.subtasks[0].position).toBe(0)
  })

  it('POST 404 when todo missing', async () => {
    const res = await POST(
      new NextRequest('http://localhost/api/todos/1/subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'x' }),
      }),
      { params: Promise.resolve({ id: '999' }) },
    )
    expect(res.status).toBe(404)
  })
})
