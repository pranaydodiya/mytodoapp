'use client'

import React, { useState } from 'react'

interface Todo {
  id: number
  text: string
  completed: boolean
}

export default function MyPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [inputValue, setInputValue] = useState('')

  const addTodo = () => {
    if (inputValue.trim()) {
      setTodos([
        ...todos,
        {
          id: Date.now(),
          text: inputValue,
          completed: false
        }
      ])
      setInputValue('')
    }
  }

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo()
    }
  }

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', fontFamily: 'Arial' }}>
      <h1>My Todo List</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a new todo..."
          style={{
            flex: 1,
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
        <button
          onClick={addTodo}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Add
        </button>
      </div>

      <div>
        {todos.length === 0 ? (
          <p style={{ color: '#999' }}>No todos yet. Add one to get started!</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {todos.map(todo => (
              <li
                key={todo.id}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  style={{ cursor: 'pointer' }}
                />
                <span
                  style={{
                    flex: 1,
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    color: todo.completed ? '#999' : '#333'
                  }}
                >
                  {todo.text}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <p>Total: {todos.length} | Completed: {todos.filter(t => t.completed).length}</p>
      </div>
    </div>
  )
}