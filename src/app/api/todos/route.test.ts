import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it } from 'vitest'
import { prisma } from '@/lib/prisma'
import { GET, POST } from './route'

describe('/api/todos', () => {
  afterEach(async () => {
    await prisma.todo.deleteMany()
    await prisma.category.deleteMany()
  })

  it('GET returns empty list', async () => {
    const res = await GET(new NextRequest('http://localhost/api/todos'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('POST creates todo and GET lists it', async () => {
    const post = await POST(
      new NextRequest('http://localhost/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '  Buy milk  ', priority: 'high' }),
      }),
    )
    expect(post.status).toBe(201)
    const created = await post.json()
    expect(created.text).toBe('Buy milk')
    expect(created.priority).toBe('high')
    expect(created.completed).toBe(false)
    expect(created.categoryId).toBeNull()
    expect(created.dueDate).toBeNull()
    expect(typeof created.createdAt).toBe('string')

    const list = await GET(new NextRequest('http://localhost/api/todos'))
    const todos = await list.json()
    expect(todos).toHaveLength(1)
    expect(todos[0].id).toBe(created.id)
  })

  it('POST with dueDate and categoryId', async () => {
    const cat = await prisma.category.create({
      data: { name: 'Work', color: '#3b82f6' },
    })
    const post = await POST(
      new NextRequest('http://localhost/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Task',
          categoryId: cat.id,
          dueDate: '2026-04-01',
        }),
      }),
    )
    expect(post.status).toBe(201)
    const row = await post.json()
    expect(row.dueDate).toBe('2026-04-01')
    expect(row.categoryId).toBe(cat.id)
  })

  it('POST rejects unknown category', async () => {
    const post = await POST(
      new NextRequest('http://localhost/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'x', categoryId: 99999 }),
      }),
    )
    expect(post.status).toBe(400)
  })

  it('GET filters by search, completed, priority, categoryId', async () => {
    const cat = await prisma.category.create({
      data: { name: 'C', color: '#000000' },
    })
    await prisma.todo.create({
      data: {
        text: 'Alpha task',
        completed: false,
        priority: 'low',
        categoryId: cat.id,
      },
    })
    await prisma.todo.create({
      data: { text: 'Beta', completed: true, priority: 'high', categoryId: null },
    })

    const bySearch = await GET(
      new NextRequest('http://localhost/api/todos?search=Alpha'),
    )
    expect((await bySearch.json()).map((t: { text: string }) => t.text)).toEqual(['Alpha task'])

    const pending = await GET(
      new NextRequest('http://localhost/api/todos?completed=false'),
    )
    expect((await pending.json())).toHaveLength(1)

    const high = await GET(new NextRequest('http://localhost/api/todos?priority=high'))
    expect((await high.json())).toHaveLength(1)

    const unc = await GET(
      new NextRequest('http://localhost/api/todos?categoryId=null'),
    )
    expect((await unc.json())).toHaveLength(1)

    const withCat = await GET(
      new NextRequest(`http://localhost/api/todos?categoryId=${cat.id}`),
    )
    expect((await withCat.json())).toHaveLength(1)
  })

  it('GET sort=dueDate_asc orders by due date', async () => {
    await prisma.todo.createMany({
      data: [
        {
          text: 'later',
          priority: 'medium',
          dueDate: new Date('2030-06-01T12:00:00.000Z'),
        },
        {
          text: 'sooner',
          priority: 'medium',
          dueDate: new Date('2026-01-15T12:00:00.000Z'),
        },
      ],
    })
    const res = await GET(
      new NextRequest('http://localhost/api/todos?sort=dueDate_asc'),
    )
    expect(res.status).toBe(200)
    const list: { text: string }[] = await res.json()
    expect(list.map(t => t.text)).toEqual(['sooner', 'later'])
  })

  it('POST rejects empty text', async () => {
    const post = await POST(
      new NextRequest('http://localhost/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '   ' }),
      }),
    )
    expect(post.status).toBe(400)
  })
})
