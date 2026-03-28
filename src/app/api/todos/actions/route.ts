import { NextRequest, NextResponse } from 'next/server'
import { jsonError, parseJsonBody } from '@/lib/api-response'
import { todoActionBodySchema } from '@/lib/api-schemas'
import { prismaTodoRepository } from '@/lib/prismaTodoRepository'

export async function POST(request: NextRequest) {
  const parsed = await parseJsonBody(request, todoActionBodySchema)
  if (!parsed.ok) return parsed.response

  const body = parsed.data

  try {
    switch (body.action) {
      case 'clearCompleted': {
        const count = await prismaTodoRepository.clearCompleted()
        return NextResponse.json({ success: true, count })
      }

      case 'toggleAll': {
        const count = await prismaTodoRepository.toggleAll(body.completed)
        return NextResponse.json({ success: true, count })
      }

      case 'getUpcoming': {
        const todos = await prismaTodoRepository.getUpcoming(body.days)
        return NextResponse.json(todos)
      }

      case 'duplicate': {
        const todo = await prismaTodoRepository.duplicate(body.id)
        if (!todo) {
          return jsonError('Todo not found', 404, { code: 'NOT_FOUND' })
        }
        return NextResponse.json(todo)
      }

      case 'bulkUpdateCategory': {
        const count = await prismaTodoRepository.bulkUpdateCategory(body.ids, body.categoryId)
        return NextResponse.json({ success: true, count })
      }

      default:
        return jsonError('Invalid action', 400, { code: 'INVALID_ACTION' })
    }
  } catch (err) {
    console.error('Bulk action error:', err)
    return jsonError('Failed to perform action', 500)
  }
}
