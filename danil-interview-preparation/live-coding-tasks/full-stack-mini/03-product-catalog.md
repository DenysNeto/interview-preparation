# Product Catalog (Next.js Full-Stack Mini)

## Statement
Build a product catalog mini-app:
- Server-side paginated product list.
- API route serving products with query params.
- Client controls for search/filter + pagination.

## Requirements
- Use Next.js + TypeScript.
- Mock in-memory product dataset.
- API supports:
  - `q` (search by name)
  - `category`
  - `page`
  - `pageSize`
- Return `{ items, page, pageSize, total, totalPages }`.
- UI should render products and allow changing filters/pagination.

## Time box
50-65 minutes

## What interviewers look for (Что ищут)
- Умение комбинировать server rendering и client interactions.
- Корректную пагинацию и фильтрацию на API-уровне.
- Чистую контрактную модель ответа API.
- Осознанность про UX и состояние (loading, empty state).

## Hints
- Создай `products` массив и pure-функцию `queryProducts`.
- Нормализуй query params (границы page/pageSize).
- Для client controls удобно использовать local state + fetch.

## Reference solution — complete TypeScript
```ts
// app/lib/products.ts
export type Product = {
  id: string;
  name: string;
  category: "books" | "electronics" | "home";
  price: number;
};

export const products: Product[] = Array.from({ length: 57 }, (_, i) => {
  const categories: Product["category"][] = ["books", "electronics", "home"];
  const category = categories[i % categories.length];
  return {
    id: String(i + 1),
    name: `${category} product ${i + 1}`,
    category,
    price: 10 + (i % 15) * 5,
  };
});

export type ProductQuery = {
  q?: string;
  category?: Product["category"] | "";
  page?: number;
  pageSize?: number;
};

export function queryProducts(query: ProductQuery) {
  const q = (query.q ?? "").trim().toLowerCase();
  const category = query.category ?? "";
  const pageSize = Math.max(1, Math.min(50, query.pageSize ?? 10));
  const page = Math.max(1, query.page ?? 1);

  const filtered = products.filter((p) => {
    const byQuery = q ? p.name.toLowerCase().includes(q) : true;
    const byCategory = category ? p.category === category : true;
    return byQuery && byCategory;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return {
    items,
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
}
```

```ts
// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Product, queryProducts } from "@/app/lib/products";

function parseCategory(raw: string | null): Product["category"] | "" {
  if (raw === "books" || raw === "electronics" || raw === "home") return raw;
  return "";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const category = parseCategory(searchParams.get("category"));
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "10");

  const result = queryProducts({
    q,
    category,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 10,
  });

  return NextResponse.json(result);
}
```

```tsx
// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  category: "books" | "electronics" | "home";
  price: number;
};

type ProductResponse = {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export default function ProductCatalogPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      q,
      category,
      page: String(page),
      pageSize: "10",
    });
    return params.toString();
  }, [q, category, page]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/products?${queryString}`, {
          signal: controller.signal,
        });
        const json = (await response.json()) as ProductResponse;
        setData(json);
      } finally {
        setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [queryString]);

  return (
    <main style={{ maxWidth: 860, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Product Catalog</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Search by name..."
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
        />
        <select
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
        >
          <option value="">All categories</option>
          <option value="books">Books</option>
          <option value="electronics">Electronics</option>
          <option value="home">Home</option>
        </select>
      </div>

      {loading && <p>Loading...</p>}
      {!loading && data && data.items.length === 0 && <p>No products found.</p>}

      {!loading && data && data.items.length > 0 && (
        <>
          <ul>
            {data.items.map((p) => (
              <li key={p.id}>
                <strong>{p.name}</strong> - {p.category} - ${p.price}
              </li>
            ))}
          </ul>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button disabled={data.page <= 1} onClick={() => setPage((v) => v - 1)}>
              Prev
            </button>
            <span>
              Page {data.page} / {data.totalPages}
            </span>
            <button
              disabled={data.page >= data.totalPages}
              onClick={() => setPage((v) => v + 1)}
            >
              Next
            </button>
            <span>Total: {data.total}</span>
          </div>
        </>
      )}
    </main>
  );
}
```

## Follow-up questions
- Как реализовать server-render первой страницы + client revalidation?
- Где лучше кешировать каталог: CDN, edge, серверный кэш?
- Как добавить сортировку и не сломать пагинацию?
