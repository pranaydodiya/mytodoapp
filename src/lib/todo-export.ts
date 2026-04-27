import type { Todo } from '@/types/todo'

/** Trigger a browser download of the current todo list as JSON. */
export function downloadTodosAsJson(todos: Todo[], filename = 'todos-export.json'): void {
  const blob = new Blob([JSON.stringify(todos, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
