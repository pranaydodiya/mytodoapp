import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it } from 'vitest'
import { prisma } from '@/lib/prisma'
import { DELETE, PATCH } from './route'

describe('/api/todos/[id]', () => {
  afterEach(async () => {
    await prisma.subtask.deleteMany()
    await prisma.todo.deleteMany()
  })

  it('PATCH updates text and fields', async () => {
    const todo = await prisma.todo.create({
      data: { text: 'old', completed: false, priority: 'low' },
    })
    const res = await PATCH(
      new NextRequest('http://localhost/api/todos/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '  new label  ', priority: 'high' }),
      }),
      { params: Promise.resolve({ id: String(todo.id) }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.text).toBe('new label')
    expect(body.priority).toBe('high')
    expect(body.subtasks).toEqual([])
  })

  it('PATCH 400 when body is empty', async () => {
    const todo = await prisma.todo.create({
      data: { text: 'x', completed: false, priority: 'medium' },
    })
    const res = await PATCH(
      new NextRequest('http://localhost/api/todos/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: String(todo.id) }) },
    )
    expect(res.status).toBe(400)
  })

  it('PATCH toggles completed', async () => {
    const todo = await prisma.todo.create({
      data: { text: 't', completed: false, priority: 'medium' },
    })
    const res = await PATCH(
      new NextRequest('http://localhost/api/todos/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      }),
      { params: Promise.resolve({ id: String(todo.id) }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.completed).toBe(true)
  })

  it('PATCH 400 for invalid id', async () => {
    const res = await PATCH(
      new NextRequest('http://localhost/api/todos/x', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      }),
      { params: Promise.resolve({ id: 'x' }) },
    )
    expect(res.status).toBe(400)
  })

  it('PATCH 404 when missing', async () => {
    const res = await PATCH(
      new NextRequest('http://localhost/api/todos/999', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      }),
      { params: Promise.resolve({ id: '999' }) },
    )
    expect(res.status).toBe(404)
  })

  it('DELETE removes todo', async () => {
    const todo = await prisma.todo.create({
      data: { text: 'gone', completed: false, priority: 'medium' },
    })
    const res = await DELETE(new NextRequest(`http://localhost/api/todos/${todo.id}`), {
      params: Promise.resolve({ id: String(todo.id) }) },
    )
    expect(res.status).toBe(200)
    const count = await prisma.todo.count()
    expect(count).toBe(0)
  })

  it('DELETE 404 when missing', async () => {
    const res = await DELETE(new NextRequest('http://localhost/api/todos/999'), {
      params: Promise.resolve({ id: '999' }) },
    )
    expect(res.status).toBe(404)
  })
})
