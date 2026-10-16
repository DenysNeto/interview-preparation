# Server List + Client Filter

## Statement
Build a products page in Next.js App Router where:
- The product list is fetched in a **Server Component**.
- Filtering by search string happens in a **Client Component**.

You must clearly show where and why `'use client'` is required.

## Requirements
- Use App Router (`app/products/page.tsx`).
- Fetch product data on the server (async Server Component).
- Render a client-side search input that filters products by title.
- Keep the server/client boundary explicit.
- Explain where `'use client'` goes and what breaks if you put it in the wrong file.

## Time box
35-45 minutes

## What interviewers look for (Что ищут)
- Понимание границы между Server и Client Components в App Router.
- Умение правильно ставить `'use client'` только там, где нужен интерактив и хуки.
- Чистую декомпозицию: данные грузятся на сервере, UI-состояние фильтра живет в клиенте.
- Аккуратную типизацию и понятные имена.
- Умение объяснить компромиссы (SSR/SEO/TTFB vs client interactivity).

## Hints
- Если используешь `useState`, файл обязан быть Client Component (`'use client'` в самом верху файла).
- Серверный `page.tsx` может передать массив продуктов в клиентский компонент через props.
- Не ставь `'use client'` в `page.tsx`, если хочешь сохранить серверный рендер и fetch на сервере.

## Reference solution — App Router TypeScript code (show file paths as comments)
```tsx
// app/products/page.tsx
import { ProductFilter } from "./ProductFilter";

type Product = {
  id: number;
  title: string;
  price: number;
};

async function getProducts(): Promise<Product[]> {
  const res = await fetch("https://fakestoreapi.com/products", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  const data = (await res.json()) as Array<{
    id: number;
    title: string;
    price: number;
  }>;

  return data.map((item) => ({
    id: item.id,
    title: item.title,
    price: item.price,
  }));
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <main style={{ padding: 24 }}>
      <h1>Products</h1>
      <p>Fetched on the server, filtered on the client.</p>
      <ProductFilter products={products} />
    </main>
  );
}
```

```tsx
// app/products/ProductFilter.tsx
'use client';

import { useMemo, useState } from "react";

type Product = {
  id: number;
  title: string;
  price: number;
};

type ProductFilterProps = {
  products: Product[];
};

export function ProductFilter({ products }: ProductFilterProps) {
  const [query, setQuery] = useState("");

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) =>
      product.title.toLowerCase().includes(normalized),
    );
  }, [products, query]);

  return (
    <section>
      <label htmlFor="search">Search</label>
      <br />
      <input
        id="search"
        type="text"
        value={query}
        placeholder="Type product title..."
        onChange={(e) => setQuery(e.target.value)}
      />

      <ul style={{ marginTop: 16 }}>
        {filteredProducts.map((product) => (
          <li key={product.id}>
            {product.title} — ${product.price}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

```md
// Explanation:
// - 'use client' goes at the top of ProductFilter.tsx because it uses useState/useMemo and event handlers.
// - page.tsx stays a Server Component by default, so data fetching runs on the server.
// - If you add 'use client' to page.tsx, the whole subtree becomes client-side, and server-only benefits are reduced.
```

## Follow-up questions
- Почему нельзя вызывать `useState` в Server Component?
- Что произойдет с bundle size и hydration, если поставить `'use client'` слишком высоко в дереве?
- Как бы ты добавил debounce для поиска?
- Где лучше делать пагинацию: на сервере или на клиенте, и почему?
