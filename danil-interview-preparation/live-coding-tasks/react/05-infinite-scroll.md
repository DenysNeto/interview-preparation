# Infinite Scroll with IntersectionObserver

## Statement
Implement infinite scrolling in React + TypeScript:
- Load items page by page.
- Use `IntersectionObserver` with a sentinel element.
- Load next page when sentinel becomes visible.
- Stop when there are no more pages.

## Requirements
- React 18+ hooks and TypeScript.
- Keep states for items, page, loading, and end-of-list flag.
- Mock paginated API is acceptable.
- Prevent duplicate loads while one request is in progress.
- Render end message when no more items.

## Time box
35-45 minutes

## What interviewers look for (Что ищут)
- Понимание `IntersectionObserver` и cleanup.
- Контроль параллельных загрузок (`loading` guard).
- Правильная пагинация и флаг окончания списка.
- Умение держать простой, но надежный state-flow.
- Аккуратная обработка ошибок.

## Hints
> - Создай `sentinelRef` и наблюдай его в `useEffect`.
> - Пока `loading === true`, не запускай следующую загрузку.
> - `hasMore` удобно вычислять из ответа API (`page < totalPages`).
> - Не забудь `disconnect()` у observer в cleanup.

## Reference solution
```tsx
import React, { useCallback, useEffect, useRef, useState } from "react";

type Post = {
  id: number;
  title: string;
};

type PageResponse = {
  items: Post[];
  hasMore: boolean;
};

const PAGE_SIZE = 10;
const TOTAL_ITEMS = 37;

async function fetchPage(page: number): Promise<PageResponse> {
  await new Promise((r) => setTimeout(r, 500));

  const start = (page - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, TOTAL_ITEMS);

  if (start >= TOTAL_ITEMS) {
    return { items: [], hasMore: false };
  }

  const items: Post[] = Array.from({ length: end - start }, (_, i) => {
    const id = start + i + 1;
    return { id, title: `Post #${id}` };
  });

  return { items, hasMore: end < TOTAL_ITEMS };
}

export default function InfiniteScrollList() {
  const [items, setItems] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadPage = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetchPage(page);
      setItems((prev) => [...prev, ...res.items]);
      setHasMore(res.hasMore);
      setPage((prev) => prev + 1);
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  useEffect(() => {
    void loadPage();
  }, []); // initial load once

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) {
          void loadPage();
        }
      },
      { root: null, rootMargin: "120px", threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadPage]);

  return (
    <section style={{ maxWidth: 520, margin: "24px auto", fontFamily: "sans-serif" }}>
      <h1>Infinite Scroll</h1>
      <ul style={{ padding: 0, listStyle: "none" }}>
        {items.map((item) => (
          <li key={item.id} style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
            {item.title}
          </li>
        ))}
      </ul>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {loading && <p>Loading more...</p>}
      {!hasMore && <p>You reached the end.</p>}

      <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />
    </section>
  );
}
```

## Follow-up questions
- What would you change for server-side rendering?
- Как защититься от дубликатов, если API иногда возвращает пересечения?
- When would you prefer a “Load more” button over infinite scroll?
- Как добавить retry-стратегию на сетевые ошибки?
