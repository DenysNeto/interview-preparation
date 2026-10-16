# Generic `useFetch<T>` Hook

## Statement
Create a reusable generic hook `useFetch<T>` in React + TypeScript.

The hook should:
- fetch data by URL
- support cancellation via `AbortController`
- optionally cache successful responses in `Map`
- return:
  - `data`
  - `error`
  - `status`
  - `refetch`

## Requirements
- Hook signature can be:
  - `useFetch<T>(url: string | null, options?: { useCache?: boolean })`
- `status` should be one of `idle | loading | success | error`.
- Abort previous request when URL changes or component unmounts.
- Optional in-memory cache by URL.
- `refetch` should force refresh (bypass cache).
- Keep API simple and interview-friendly.

## Time box
40-50 minutes

## What interviewers look for (Что ищут)
- Умение писать generic hook с типами `<T>`.
- Ясный контракт возвращаемого значения.
- Корректный cleanup и отсутствие утечек.
- Простая и надежная стратегия кеширования.
- Обработка edge cases: `url = null`, abort, повторный запрос.

## Hints
> - Для кеша можно использовать `useRef(new Map<string, unknown>())`.
> - Вынеси общий fetch в `useCallback`, чтобы использовать и при авто-запуске, и в `refetch`.
> - `refetch` удобно делать с флагом `force = true`.
> - Для `AbortError` не выставляй error-state как "ошибку пользователя".

## Reference solution
```tsx
import { useCallback, useEffect, useRef, useState } from "react";

type FetchStatus = "idle" | "loading" | "success" | "error";

type UseFetchOptions = {
  useCache?: boolean;
  init?: RequestInit;
};

type UseFetchResult<T> = {
  data: T | null;
  error: string | null;
  status: FetchStatus;
  refetch: () => Promise<void>;
};

export function useFetch<T>(
  url: string | null,
  options: UseFetchOptions = {}
): UseFetchResult<T> {
  const { useCache = true, init } = options;
  const cacheRef = useRef<Map<string, T>>(new Map());
  const abortRef = useRef<AbortController | null>(null);

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<FetchStatus>("idle");

  const runFetch = useCallback(
    async (force = false) => {
      if (!url) {
        setStatus("idle");
        setData(null);
        setError(null);
        return;
      }

      if (!force && useCache && cacheRef.current.has(url)) {
        setData(cacheRef.current.get(url) ?? null);
        setStatus("success");
        setError(null);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus("loading");
      setError(null);

      try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as T;
        if (useCache) {
          cacheRef.current.set(url, json);
        }
        setData(json);
        setStatus("success");
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err.message : "Unknown error");
        setStatus("error");
      }
    },
    [url, useCache, init]
  );

  useEffect(() => {
    void runFetch(false);
    return () => abortRef.current?.abort();
  }, [runFetch]);

  const refetch = useCallback(async () => {
    await runFetch(true);
  }, [runFetch]);

  return { data, error, status, refetch };
}

// Usage example
type User = { id: number; name: string; email: string };

export function UsersPanel() {
  const { data, error, status, refetch } = useFetch<User[]>(
    "https://jsonplaceholder.typicode.com/users",
    { useCache: true }
  );

  return (
    <section style={{ fontFamily: "sans-serif" }}>
      <h2>Users</h2>
      <button onClick={() => void refetch()}>Refetch</button>

      {status === "loading" && <p>Loading...</p>}
      {status === "error" && <p style={{ color: "crimson" }}>{error}</p>}

      {status === "success" && (
        <ul>
          {data?.map((u) => (
            <li key={u.id}>
              {u.name} ({u.email})
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

## Follow-up questions
- How would you support POST/PUT with the same hook?
- Как бы ты добавил TTL для кеша?
- Should retries belong inside this hook or outside?
- Как разделить transport-level и domain-level ошибки?
