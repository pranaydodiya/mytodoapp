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
  list(filters?: TodoFilters): Todo[]
  getById(id: number): Todo | undefined
  create(input: CreateTodoInput): Todo
  update(id: number, input: UpdateTodoInput): Todo | undefined
  delete(id: number): boolean
  getCategories(): Category[]
  addCategory(category: Category): Category
  deleteCategory(id: number): boolean
}

class InMemoryTodoRepository implements TodoRepository {
  list(filters: TodoFilters = {}): Todo[] {
    const { search, completed, priority, categoryId } = filters

    return todos.filter(todo => {
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

  getById(id: number): Todo | undefined {
    return todos.find(t => t.id === id)
  }

  create(input: CreateTodoInput): Todo {
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

  update(id: number, input: UpdateTodoInput): Todo | undefined {
    const todo = todos.find(t => t.id === id)
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

  delete(id: number): boolean {
    const index = todos.findIndex(t => t.id === id)
    if (index === -1) return false
    todos.splice(index, 1)
    return true
  }

  getCategories(): Category[] {
    return categories
  }

  addCategory(category: Category): Category {
    categories.push(category)
    return category
  }

  deleteCategory(id: number): boolean {
    const index = categories.findIndex(c => c.id === id)
    if (index === -1) return false
    categories.splice(index, 1)
    return true
  }
}

export const todoRepository: TodoRepository = new InMemoryTodoRepository()

