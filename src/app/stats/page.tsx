"use client";

import { useEffect, useState } from "react";

type Todo = {
  _id: string;
  title: string;
  completed: boolean;
};

export default function StatsPage() {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    fetch("/api/todos")
      .then((res) => res.json())
      .then((data) => setTodos(data));
  }, []);

  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const pending = total - completed;

  return (
    <div style={{ padding: "40px" }}>
      <h1>Todo Statistics</h1>

      <div style={{ marginTop: "20px" }}>
        <p><strong>Total Todos:</strong> {total}</p>
        <p><strong>Completed:</strong> {completed}</p>
        <p><strong>Pending:</strong> {pending}</p>
      </div>
    </div>
  );
}