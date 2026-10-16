# URL Shortener (Next.js Full-Stack Mini)

## Statement
Build a tiny URL shortener in Next.js:
- Form page to submit a long URL.
- API route to create short code.
- Redirect route that resolves code to original URL.
- In-memory `Map` as storage.

## Requirements
- TypeScript only.
- Validate URL input.
- Generate unique short code (6-8 chars).
- Return short URL and support redirect by code.
- Show basic success/error states in UI.

## Time box
45-60 minutes

## What interviewers look for (Что ищут)
- Полный вертикальный срез: UI -> API -> redirect.
- Корректную валидацию URL и обработку ошибок.
- Понимание ограничений in-memory решения.
- Способность писать минимальный, но рабочий DX.

## Hints
- Для кода используй `Math.random().toString(36).slice(...)`.
- Проверяй уникальность кода в `Map`.
- Redirect удобно сделать через динамический route `/[code]`.

## Reference solution — complete TypeScript
```ts
// app/lib/shortener-store.ts
const codeToUrl = new Map<string, string>();

export function getUrlByCode(code: string): string | undefined {
  return codeToUrl.get(code);
}

function randomCode(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function createShortCode(url: string): string {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = randomCode(7);
    if (!codeToUrl.has(code)) {
      codeToUrl.set(code, url);
      return code;
    }
  }
  throw new Error("Could not generate a unique short code.");
}
```

```ts
// app/lib/url-validation.ts
export function validateHttpUrl(value: unknown): {
  ok: boolean;
  error?: string;
  normalized?: string;
} {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false, error: "URL is required." };
  }
  try {
    const parsed = new URL(value.trim());
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { ok: false, error: "Only HTTP/HTTPS URLs are supported." };
    }
    return { ok: true, normalized: parsed.toString() };
  } catch {
    return { ok: false, error: "Invalid URL format." };
  }
}
```

```ts
// app/api/shorten/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createShortCode } from "@/app/lib/shortener-store";
import { validateHttpUrl } from "@/app/lib/url-validation";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = validateHttpUrl(body?.url);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const code = createShortCode(validation.normalized!);
    return NextResponse.json({ code, shortPath: `/${code}` }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
```

```tsx
// app/page.tsx
"use client";

import { FormEvent, useState } from "react";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [shortPath, setShortPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setShortPath(null);
    setLoading(true);
    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to shorten URL.");
        return;
      }
      setShortPath(data.shortPath);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>URL Shortener</h1>
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          style={{ flex: 1 }}
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Shorten"}
        </button>
      </form>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {shortPath && (
        <p>
          Short URL: <a href={shortPath}>{shortPath}</a>
        </p>
      )}
    </main>
  );
}
```

```tsx
// app/[code]/page.tsx
import { redirect, notFound } from "next/navigation";
import { getUrlByCode } from "@/app/lib/shortener-store";

type Props = { params: Promise<{ code: string }> };

export default async function RedirectPage({ params }: Props) {
  const { code } = await params;
  const url = getUrlByCode(code);
  if (!url) {
    notFound();
  }
  redirect(url);
}
```

## Follow-up questions
- Как добавить TTL и авто-очистку старых short links?
- Как защититься от злоупотреблений (rate limit, abuse URLs)?
- Как бы выглядела миграция на БД и распределенный кэш?
