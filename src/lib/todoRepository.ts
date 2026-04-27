import { categories, todos } from '@/lib/store'
import type { Category, Priority, Todo } from '@/types/todo'

export interface TodoFilters {
  search?: string
  completed?: boolean
  priority?: Priority
  categoryId?: number | null
}

export interface CreateTodoInput {
  text: string
  priority?: Priority
  categoryId?: number | null
  dueDate?: string | null
}

export interface UpdateTodoInput {
  text?: string
  completed?: boolean
  priority?: Priority
  categoryId?: number | null
  dueDate?: string | null
}

export interface TodoRepository {
  list(filters?: TodoFilters): Promise<Todo[]>
  getById(id: number): Promise<Todo | undefined>
  create(input: CreateTodoInput): Promise<Todo>
  update(id: number, input: UpdateTodoInput): Promise<Todo | undefined>
  delete(id: number): Promise<boolean>
  getCategories(): Promise<Category[]>
  addCategory(category: Category): Promise<Category>
  deleteCategory(id: number): Promise<boolean>

  // ✨ New 5 functions
  clearCompleted(): Promise<number> // returns count of deleted
  toggleAll(completed: boolean): Promise<number> // returns count of updated
  getUpcoming(days: number): Promise<Todo[]>
  duplicate(id: number): Promise<Todo | undefined>
  bulkUpdateCategory(ids: number[], categoryId: number | null): Promise<number>

  // 🚀 Even MORE functions (5 more)
  getOverdue(): Promise<Todo[]>
  getRecentlyCompleted(limit: number): Promise<Todo[]>
  bulkDelete(ids: number[]): Promise<number>
  bulkCreate(inputs: CreateTodoInput[]): Promise<Todo[]>
  getDailyProductivitySnapshot(): Promise<{ completedToday: number; createdToday: number }>
}

class InMemoryTodoRepository implements TodoRepository {
  async list(filters: TodoFilters = {}): Promise<Todo[]> {
    const { search, completed, priority, categoryId } = filters

    return todos.filter((todo: Todo) => {
      if (typeof completed === 'boolean' && todo.completed !== completed) {
        return false
      }

      if (priority && todo.priority !== priority) {
        return false
      }

      if (typeof categoryId !== 'undefined' && todo.categoryId !== categoryId) {
        return false
      }

      if (search) {
        const q = search.toLowerCase()
        if (!todo.text.toLowerCase().includes(q)) {
          return false
        }
      }

      return true
    })
  }

  async getById(id: number): Promise<Todo | undefined> {
    return todos.find((t: Todo) => t.id === id)
  }

  async create(input: CreateTodoInput): Promise<Todo> {
    const now = new Date()
    const todo: Todo = {
      id: Date.now(),
      text: input.text,
      completed: false,
      priority: input.priority ?? 'medium',
      categoryId: typeof input.categoryId === 'undefined' ? null : input.categoryId,
      dueDate: typeof input.dueDate === 'undefined' ? null : input.dueDate,
      createdAt: now.toISOString(),
    }

    todos.push(todo)
    return todo
  }

  async update(id: number, input: UpdateTodoInput): Promise<Todo | undefined> {
    const todo = todos.find((t: Todo) => t.id === id)
    if (!todo) return undefined

    if (typeof input.text !== 'undefined') {
      todo.text = input.text
    }
    if (typeof input.completed !== 'undefined') {
      todo.completed = input.completed
    }
    if (typeof input.priority !== 'undefined') {
      todo.priority = input.priority
    }
    if (typeof input.categoryId !== 'undefined') {
      todo.categoryId = input.categoryId
    }
    if (typeof input.dueDate !== 'undefined') {
      todo.dueDate = input.dueDate
    }

    return todo
  }

  async delete(id: number): Promise<boolean> {
    const index = todos.findIndex((t: Todo) => t.id === id)
    if (index === -1) return false
    todos.splice(index, 1)
    return true
  }

  async getCategories(): Promise<Category[]> {
    return categories
  }

  async addCategory(category: Category): Promise<Category> {
    categories.push(category)
    return category
  }

  async deleteCategory(id: number): Promise<boolean> {
    const index = categories.findIndex((c: Category) => c.id === id)
    if (index === -1) return false
    categories.splice(index, 1)
    return true
  }

  // ✨ Implement new 5 functions in-memory
  async clearCompleted(): Promise<number> {
    const count = todos.filter((t: Todo) => t.completed).length
    const next = todos.filter((t: Todo) => !t.completed)
    // Mutate the "shared" store (not ideal but consistent with existing)
    todos.length = 0
    todos.push(...next)
    return count
  }

  async toggleAll(completed: boolean): Promise<number> {
    todos.forEach((t: Todo) => (t.completed = completed))
    return todos.length
  }

  async getUpcoming(days: number): Promise<Todo[]> {
    const now = new Date()
    const future = new Date()
    future.setDate(now.getDate() + days)
    const futureStr = future.toISOString().slice(0, 10)
    const nowStr = now.toISOString().slice(0, 10)
    return todos.filter((t: Todo) => !t.completed && t.dueDate && t.dueDate >= nowStr && t.dueDate <= futureStr)
  }

  async duplicate(id: number): Promise<Todo | undefined> {
    const todo = todos.find((t: Todo) => t.id === id)
    if (!todo) return undefined
    const clone: Todo = {
      ...todo,
      id: Date.now() + Math.floor(Math.random() * 1000),
      text: `${todo.text} (copy)`,
      createdAt: new Date().toISOString(),
    }
    todos.push(clone)
    return clone
  }

  async bulkUpdateCategory(ids: number[], categoryId: number | null): Promise<number> {
    let count = 0
    todos.forEach((t: Todo) => {
      if (ids.includes(t.id)) {
        t.categoryId = categoryId
        count++
      }
    })
    return count
  }

  // 🚀 Even MORE functions (5 more)
  async getOverdue(): Promise<Todo[]> {
    const now = new Date().toISOString().slice(0, 10)
    return todos.filter((t: Todo) => !t.completed && t.dueDate && t.dueDate < now)
  }

  async getRecentlyCompleted(limit: number): Promise<Todo[]> {
    return todos
      .filter((t: Todo) => t.completed)
      .sort((a: Todo, b: Todo) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
  }

  async bulkDelete(ids: number[]): Promise<number> {
    let count = 0
    ids.forEach(id => {
      const index = todos.findIndex((t: Todo) => t.id === id)
      if (index !== -1) {
        todos.splice(index, 1)
        count++
      }
    })
    return count
  }

  async bulkCreate(inputs: CreateTodoInput[]): Promise<Todo[]> {
    const created: Todo[] = []
    for (const input of inputs) {
      const todo = await this.create(input)
      created.push(todo)
    }
    return created
  }

  async getDailyProductivitySnapshot(): Promise<{ completedToday: number; createdToday: number }> {
    const today = new Date().toISOString().slice(0, 10)
    const completedToday = todos.filter(
      (t: Todo) => t.completed && t.createdAt.startsWith(today),
    ).length
    const createdToday = todos.filter((t: Todo) => t.createdAt.startsWith(today)).length
    return { completedToday, createdToday }
  }
}

export const todoRepository: TodoRepository = new InMemoryTodoRepository()

