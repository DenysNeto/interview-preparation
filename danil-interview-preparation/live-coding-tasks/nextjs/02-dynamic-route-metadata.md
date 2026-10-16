# Dynamic Route with Metadata and notFound

## Statement
Create a dynamic product details page using App Router:
- Route: `app/products/[id]/page.tsx`
- Use `generateMetadata` for dynamic `<title>` and description.
- Call `notFound()` when a product does not exist.
- Use Next.js 15 style route params typing: `params: Promise<{ id: string }>`.

## Requirements
- Implement dynamic route page with async params style.
- Implement `generateMetadata` with fetched product data.
- Use `notFound()` for missing records.
- Keep code fully typed in TypeScript.
- Avoid duplicate parsing logic where possible.

## Time box
30-40 minutes

## What interviewers look for (Что ищут)
- Актуальное знание App Router API, включая `generateMetadata`.
- Понимание подхода Next 15 с `params` как `Promise`.
- Корректное использование `notFound()` вместо ручного `return null`.
- Умение переиспользовать data-fetching код между page и metadata.
- Читаемую типизацию и обработку edge cases.

## Hints
- Сделай маленький helper `getProductById`, который возвращает `Product | null`.
- В `generateMetadata` тоже можно вызывать тот же helper.
- `const { id } = await params` нужен и в `page`, и в `generateMetadata`.

## Reference solution — App Router TypeScript code (show file paths as comments)
```ts
// lib/products.ts
export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
};

const PRODUCTS: Product[] = [
  { id: "1", title: "Keyboard", description: "Mechanical keyboard", price: 99 },
  { id: "2", title: "Mouse", description: "Wireless mouse", price: 49 },
  { id: "3", title: "Monitor", description: "27-inch 4K monitor", price: 399 },
];

export async function getProductById(id: string): Promise<Product | null> {
  const product = PRODUCTS.find((item) => item.id === id);
  return product ?? null;
}
```

```tsx
// app/products/[id]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/products";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "Requested product does not exist.",
    };
  }

  return {
    title: `${product.title} | Product Details`,
    description: product.description,
  };
}

export default async function ProductDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>{product.title}</h1>
      <p>{product.description}</p>
      <strong>${product.price}</strong>
    </main>
  );
}
```

## Follow-up questions
- Зачем нужен `notFound()` вместо `throw new Error()` для отсутствующей записи?
- Как избежать двойного запроса в `generateMetadata` и `page`?
- Когда стоит использовать `generateStaticParams` для `[id]`?
- Как ты добавишь Open Graph metadata для шаринга?
