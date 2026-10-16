# Todo List with Filters and Persistence

## Statement
Build a Todo list app in React + TypeScript.  
User can add items, toggle completion, delete items, and filter by:
- `all`
- `active`
- `completed`

Persist todos in `localStorage` so data survives page reload.

## Requirements
- Use React 18+ hooks and TypeScript.
- `Todo` type must be:
  - `id: string`
  - `text: string`
  - `done: boolean`
- Add todo via input + button (or Enter).
- Toggle done state on click.
- Delete item.
- Filter list by `all / active / completed`.
- Persist todos to `localStorage`.
- Keep solution interview-realistic (clean, no extra libs).

## Time box
35-45 minutes

## What interviewers look for (Что ищут)
- Корректные типы и понятные имена (`Todo`, `Filter`).
- Разделение состояния: список, фильтр, input.
- Иммутабельные обновления массива (`map`, `filter`).
- Базовая UX-аккуратность: trim, запрет пустых задач.
- Грамотная работа с `localStorage` и инициализацией.
- Читаемая структура компонента без лишней магии.

## Hints
> - Подумай, как инициализировать `todos` из `localStorage` только один раз.
> - Для фильтрации удобно сделать `filteredTodos` через `useMemo`.
> - Не забывай `text.trim()` перед добавлением.
> - Для сохранения в `localStorage` достаточно `useEffect` на `todos`.

## Reference solution
```tsx
import React, { useEffect, useMemo, useState } from "react";

type Todo = {
  id: string;
  text: string;
  done: boolean;
};

type Filter = "all" | "active" | "completed";

const STORAGE_KEY = "react-live-coding-todos";

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is Todo =>
          typeof item?.id === "string" &&
          typeof item?.text === "string" &&
          typeof item?.done === "boolean"
      )
      .map((t) => ({ ...t, text: t.text.trim() }))
      .filter((t) => t.text.length > 0);
  } catch {
    return [];
  }
}

export default function TodoListApp() {
  const [todos, setTodos] = useState<Todo[]>(() => loadTodos());
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const filteredTodos = useMemo(() => {
    if (filter === "active") {
      return todos.filter((t) => !t.done);
    }
    if (filter === "completed") {
      return todos.filter((t) => t.done);
    }
    return todos;
  }, [todos, filter]);

  const addTodo = () => {
    const text = input.trim();
    if (!text) return;

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      done: false,
    };

    setTodos((prev) => [newTodo, ...prev]);
    setInput("");
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <main style={{ maxWidth: 520, margin: "32px auto", fontFamily: "sans-serif" }}>
      <h1>Todo List</h1>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addTodo();
          }}
          placeholder="Add a task"
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={addTodo}>Add</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button disabled={filter === "all"} onClick={() => setFilter("all")}>
          All
        </button>
        <button disabled={filter === "active"} onClick={() => setFilter("active")}>
          Active
        </button>
        <button
          disabled={filter === "completed"}
          onClick={() => setFilter("completed")}
        >
          Completed
        </button>
      </div>

      <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
        {filteredTodos.map((todo) => (
          <li
            key={todo.id}
            style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}
          >
            <label style={{ flex: 1, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggleTodo(todo.id)}
                style={{ marginRight: 8 }}
              />
              <span style={{ textDecoration: todo.done ? "line-through" : "none" }}>
                {todo.text}
              </span>
            </label>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>

      <p style={{ color: "#666" }}>
        Total: {todos.length} | Active: {todos.filter((t) => !t.done).length}
      </p>
    </main>
  );
}
```

## Follow-up questions
- How would you test persistence and filtering behavior?
- Как добавить кнопку `Clear completed` без дублирования логики?
- What if multiple tabs update the same `localStorage` key?
- Как вынести работу с `localStorage` в отдельный хук?
