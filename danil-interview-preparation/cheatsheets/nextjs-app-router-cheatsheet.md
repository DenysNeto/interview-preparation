# Next.js App Router Cheatsheet

Теория SSR, статики и гидратации, вопросами: [nextjs-ssr-hydration.ru.md](nextjs-ssr-hydration.ru.md).

## Mental model

| Layer | Runs on | Can use hooks? | Can fetch secrets? |
| --- | --- | --- | --- |
| Server Component (default) | Server | No | Yes |
| Client Component (`'use client'`) | Browser (+ SSR hydrate) | Yes | No (public env only) |
| Route Handler `app/api/*/route.ts` | Server | N/A | Yes |
| Server Action | Server | N/A | Yes |
| `middleware.ts` | Edge | Limited | Careful with secrets |

**Rule:** push `'use client'` as far down the tree as possible.

## File conventions

```
app/
  layout.tsx
  page.tsx
  loading.tsx
  error.tsx          # client component
  not-found.tsx
  products/
    page.tsx
    [id]/
      page.tsx
  api/
    products/
      route.ts
middleware.ts
```

## Server Component list + Client filter

```tsx
// app/products/page.tsx  (Server Component)
import { ProductFilter } from './product-filter';

async function getProducts() {
  const res = await fetch('https://api.example.com/products', {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json() as Promise<Product[]>;
}

export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductFilter products={products} />;
}
```

```tsx
// product-filter.tsx
'use client';

import { useMemo, useState } from 'react';

export function ProductFilter({ products }: { products: Product[] }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())),
    [products, q],
  );
  return (
    <>
      <input value={q} onChange={(e) => setQ(e.target.value)} />
      <ul>
        {filtered.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </>
  );
}
```

## Dynamic route + metadata + notFound

```tsx
// app/products/[id]/page.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  return { title: product?.name ?? 'Product' };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  return <h1>{product.name}</h1>;
}
```

## Route Handler

```ts
// app/api/products/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';

const Body = z.object({ name: z.string().min(1) });

export async function GET() {
  return NextResponse.json(await listProducts());
}

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const created = await createProduct(parsed.data);
  return NextResponse.json(created, { status: 201 });
}
```

## Server Action + form

```tsx
// actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function createNote(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  if (!title) return { ok: false as const, error: 'Title required' };
  await db.notes.create({ title });
  revalidatePath('/notes');
  return { ok: true as const };
}
```

```tsx
// notes-form.tsx
'use client';

import { useActionState } from 'react';
import { createNote } from './actions';

export function NotesForm() {
  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => createNote(formData),
    null,
  );

  return (
    <form action={action}>
      <input name="title" />
      <button disabled={pending}>Save</button>
      {state && !state.ok && <p>{state.error}</p>}
    </form>
  );
}
```

## Auth middleware (cookie sketch)

```ts
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login');
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
```

## Suspense / loading / error

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { SlowWidget } from './slow-widget';

export default function Page() {
  return (
    <Suspense fallback={<p>Loading widget…</p>}>
      <SlowWidget />
    </Suspense>
  );
}
```

- `loading.tsx` — automatic Suspense boundary for the segment.
- `error.tsx` — must be a Client Component with `error` + `reset` props.

## Caching one-liners (App Router)

- `fetch` in Server Components is cached by default (Next can memoize).
- `cache: 'no-store'` — always fresh.
- `next: { revalidate: 60 }` — ISR-like.
- `revalidatePath('/x')` / `revalidateTag('y')` after mutations.

## When to say what on interview

- **RSC** for data fetch + SEO + less JS.
- **Client** for interactivity (input, effects, browser APIs).
- **Route Handler** for HTTP API / webhooks.
- **Server Action** for form mutations from React tree.
- **Middleware** for redirects / auth gates / headers (keep thin).
