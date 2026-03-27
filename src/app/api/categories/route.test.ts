import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it } from 'vitest'
import { prisma } from '@/lib/prisma'
import { DELETE, GET, POST } from './route'

describe('/api/categories', () => {
  afterEach(async () => {
    await prisma.todo.deleteMany()
    await prisma.category.deleteMany()
  })

  it('GET lists categories', async () => {
    await prisma.category.create({ data: { name: 'A', color: '#111111' } })
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].name).toBe('A')
  })

  it('POST creates category', async () => {
    const res = await POST(
      new NextRequest('http://localhost/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '  B  ', color: '#abcdef' }),
      }),
    )
    expect(res.status).toBe(201)
    const row = await res.json()
    expect(row.name).toBe('B')
    expect(row.color).toBe('#abcdef')
  })

  it('DELETE removes category and nulls todos', async () => {
    const cat = await prisma.category.create({
      data: { name: 'C', color: '#222222' },
    })
    await prisma.todo.create({
      data: { text: 't', priority: 'medium', categoryId: cat.id },
    })
    const res = await DELETE(
      new NextRequest(`http://localhost/api/categories?id=${cat.id}`),
    )
    expect(res.status).toBe(200)
    const todo = await prisma.todo.findFirst()
    expect(todo?.categoryId).toBeNull()
  })
})
