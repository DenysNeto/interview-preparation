# Debounced Search with AbortController

## Statement
Build a search UI with React + TypeScript:
- User types into an input.
- Request is sent to a mock API with debounce (e.g., 400 ms).
- Show loading, data, and error states.
- Handle race conditions so only the latest query updates UI.

## Requirements
- React 18+ hooks and TypeScript.
- Debounced request after user stops typing.
- Fetch from mock endpoint (can be local fake function).
- Show:
  - loading indicator
  - results list
  - error message
- Cancel previous requests using `AbortController`.
- Ignore empty/whitespace queries.

## Time box
35-45 minutes

## What interviewers look for (Что ищут)
- Понимание debounce и зачем он нужен.
- Корректная работа с `AbortController` и cleanup в `useEffect`.
- Управление состояниями `idle/loading/success/error`.
- Отсутствие race condition (старый ответ не перетирает новый).
- Читабельный код без избыточных абстракций.

## Hints
> - Раздели `query` и `debouncedQuery`.
> - В `useEffect` на `debouncedQuery` создавай новый `AbortController`.
> - При `AbortError` обычно не показывают "real" error пользователю.
> - Для пустого запроса сбрасывай результаты и статус в `idle`.

## Reference solution
```tsx
import React, { useEffect, useState } from "react";

type SearchItem = {
  id: string;
  title: string;
};

type Status = "idle" | "loading" | "success" | "error";

const MOCK_DB: SearchItem[] = [
  { id: "1", title: "React hooks" },
  { id: "2", title: "React context" },
  { id: "3", title: "TypeScript generics" },
  { id: "4", title: "Debounce and throttle" },
  { id: "5", title: "AbortController guide" },
];

async function mockSearchApi(query: string, signal: AbortSignal): Promise<SearchItem[]> {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 650);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

  const normalized = query.toLowerCase();
  return MOCK_DB.filter((item) => item.title.toLowerCase().includes(normalized));
}

export default function DebouncedSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setStatus("idle");
      setResults([]);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setStatus("loading");
    setError(null);

    mockSearchApi(debouncedQuery, controller.signal)
      .then((data) => {
        setResults(data);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setStatus("error");
        setError("Something went wrong while searching.");
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  return (
    <section style={{ maxWidth: 560, margin: "32px auto", fontFamily: "sans-serif" }}>
      <h1>Debounced Search</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        style={{ width: "100%", padding: 8 }}
      />

      {status === "loading" && <p>Loading...</p>}
      {status === "error" && <p style={{ color: "crimson" }}>{error}</p>}

      {status === "success" && (
        <ul>
          {results.length === 0 ? (
            <li>No matches</li>
          ) : (
            results.map((item) => <li key={item.id}>{item.title}</li>)
          )}
        </ul>
      )}
    </section>
  );
}
```

## Follow-up questions
- How would you add request caching by query?
- Почему debounce лучше делать до `fetch`, а не после?
- What is the difference between aborting and ignoring stale responses?
- Как протестировать эту логику в unit/integration тестах?
