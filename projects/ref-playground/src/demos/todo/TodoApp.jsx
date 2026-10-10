import { useState } from "react";

const FILTERS = [
  ["all", "All"],
  ["open", "Open"],
  ["done", "Done"],
];

export function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("all");

  function addTodo(event) {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;

    setTodos((existing) => [...existing, { id: crypto.randomUUID(), title, done: false }]);
    setDraft("");
  }

  function toggleTodo(id) {
    setTodos((existing) =>
      existing.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)),
    );
  }

  function removeTodo(id) {
    setTodos((existing) => existing.filter((todo) => todo.id !== id));
  }

  const visible = todos.filter((todo) => {
    if (filter === "open") return !todo.done;
    if (filter === "done") return todo.done;
    return true;
  });
  const remaining = todos.filter((todo) => !todo.done).length;

  return (
    <section className="panel">
      <h2>Todo list</h2>
      <ul className="notes">
        <li>The input is controlled. React state is the text, and the DOM follows it.</li>
        <li>Add, toggle, and delete replace the array. They never push or splice the old one.</li>
        <li>The updater receives the latest list, so two quick adds cannot overwrite each other.</li>
        <li>Each row uses a stable id as its key. The index would reuse state after a delete.</li>
        <li>The visible list and the remaining count are calculated during render. They are not state.</li>
      </ul>
      <form className="row" onSubmit={addTodo}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a task"
          aria-label="New task"
        />
        <button type="submit">Add</button>
      </form>
      <div className="row">
        {FILTERS.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
        <span>
          {remaining} open
        </span>
      </div>
      {visible.length === 0 ? (
        <p>Nothing here.</p>
      ) : (
        <ul className="todos">
          {visible.map((todo) => (
            <li key={todo.id}>
              <label>
                <input type="checkbox" checked={todo.done} onChange={() => toggleTodo(todo.id)} />
                <span className={todo.done ? "done" : undefined}>{todo.title}</span>
              </label>
              <button type="button" onClick={() => removeTodo(todo.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
