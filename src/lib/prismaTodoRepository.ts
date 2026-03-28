import type { Category, Todo } from '@/types/todo'
import { prisma } from '@/lib/prisma'
import { todoToDto } from '@/lib/todo-mappers'
import type {
  CreateTodoInput,
  TodoFilters,
  TodoRepository,
  UpdateTodoInput,
} from './todoRepository'

export class PrismaTodoRepository implements TodoRepository {
  async list(filters: TodoFilters = {}): Promise<Todo[]> {
    const { search, completed, priority, categoryId } = filters
    const where: any = {}

    if (search) where.text = { contains: search }
    if (typeof completed === 'boolean') where.completed = completed
    if (priority) where.priority = priority
    if (typeof categoryId !== 'undefined') where.categoryId = categoryId

    const rows = await prisma.todo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(todoToDto)
  }

  async getById(id: number): Promise<Todo | undefined> {
    const row = await prisma.todo.findUnique({ where: { id } })
    return row ? todoToDto(row) : undefined
  }

  async create(input: CreateTodoInput): Promise<Todo> {
    const row = await prisma.todo.create({
      data: {
        text: input.text,
        priority: input.priority ?? 'medium',
        categoryId: input.categoryId,
        dueDate: input.dueDate ? new Date(`${input.dueDate}T12:00:00.000Z`) : null,
      },
    })
    return todoToDto(row)
  }

  async update(id: number, input: UpdateTodoInput): Promise<Todo | undefined> {
    const data: any = {}
    if (input.text !== undefined) data.text = input.text
    if (input.completed !== undefined) data.completed = input.completed
    if (input.priority !== undefined) data.priority = input.priority
    if (input.categoryId !== undefined) data.categoryId = input.categoryId
    if (input.dueDate !== undefined) {
      data.dueDate = input.dueDate ? new Date(`${input.dueDate}T12:00:00.000Z`) : null
    }

    const row = await prisma.todo.update({
      where: { id },
      data,
    })
    return todoToDto(row)
  }

  async delete(id: number): Promise<boolean> {
    await prisma.todo.delete({ where: { id } })
    return true
  }

  async getCategories(): Promise<Category[]> {
    return await prisma.category.findMany()
  }

  async addCategory(category: Category): Promise<Category> {
    return await prisma.category.create({
      data: {
        name: category.name,
        color: category.color,
      },
    })
  }

  async deleteCategory(id: number): Promise<boolean> {
    await prisma.category.delete({ where: { id } })
    return true
  }

  // ✨ New 5 functions
  async clearCompleted(): Promise<number> {
    const result = await prisma.todo.deleteMany({
      where: { completed: true },
    })
    return result.count
  }

  async toggleAll(completed: boolean): Promise<number> {
    const result = await prisma.todo.updateMany({
      data: { completed },
    })
    return result.count
  }

  async getUpcoming(days: number): Promise<Todo[]> {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    const rows = await prisma.todo.findMany({
      where: {
        completed: false,
        dueDate: {
          gte: new Date(),
          lte: futureDate,
        },
      },
    })
    return rows.map(todoToDto)
  }

  async duplicate(id: number): Promise<Todo | undefined> {
    const original = await prisma.todo.findUnique({ where: { id } })
    if (!original) return undefined

    const row = await prisma.todo.create({
      data: {
        text: `${original.text} (copy)`,
        priority: original.priority,
        categoryId: original.categoryId,
        dueDate: original.dueDate,
        completed: false,
      },
    })
    return todoToDto(row)
  }

  async bulkUpdateCategory(ids: number[], categoryId: number | null): Promise<number> {
    const result = await prisma.todo.updateMany({
      where: { id: { in: ids } },
      data: { categoryId },
    })
    return result.count
  }

  // 🚀 Even MORE functions (5 more)
  async getOverdue(): Promise<Todo[]> {
    const now = new Date()
    const rows = await prisma.todo.findMany({
      where: {
        completed: false,
        dueDate: { lt: now },
      },
    })
    return rows.map(todoToDto)
  }

  async getRecentlyCompleted(limit: number): Promise<Todo[]> {
    const rows = await prisma.todo.findMany({
      where: { completed: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return rows.map(todoToDto)
  }

  async bulkDelete(ids: number[]): Promise<number> {
    const result = await prisma.todo.deleteMany({
      where: { id: { in: ids } },
    })
    return result.count
  }

  async bulkCreate(inputs: CreateTodoInput[]): Promise<Todo[]> {
    // Prisma does not return created records on createMany in all databases (like SQLite)
    // So we do them one by one or fetch them back. For simplicity, one by one.
    const created: Todo[] = []
    for (const input of inputs) {
      created.push(await this.create(input))
    }
    return created
  }

  async getDailyProductivitySnapshot(): Promise<{ completedToday: number; createdToday: number }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const [completedToday, createdToday] = await Promise.all([
      prisma.todo.count({
        where: {
          completed: true,
          createdAt: { gte: today },
        },
      }),
      prisma.todo.count({
        where: {
          createdAt: { gte: today },
        },
      }),
    ])
    return { completedToday, createdToday }
  }
}

export const prismaTodoRepository = new PrismaTodoRepository()
