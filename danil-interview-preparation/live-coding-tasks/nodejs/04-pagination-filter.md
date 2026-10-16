# 04 — Pagination + Filtering + Sorting API

## Statement
Implement `GET /items` with support for:
- `page` (default `1`)
- `limit` (default `10`)
- `sort` (`name`, `-name`, `price`, `-price`, `createdAt`, `-createdAt`)
- `q` (case-insensitive substring search by `name`)

Return paginated data with metadata.

## Requirements
- TypeScript + Express.
- In-memory dataset is enough.
- Validate and normalize query params.
- Response format:
  - `data: Item[]`
  - `meta: { page, limit, total, totalPages, hasNext, hasPrev }`

## Time box
35-50 minutes

## What interviewers look for (Что ищут)
- Корректная математика пагинации и граничные случаи.
- Чистая обработка query-параметров и их дефолтов.
- Читаемый pipeline: filter -> sort -> paginate.
- Внимание к производительности и расширяемости API.

## Hints
- Сначала распарси `page`/`limit`, затем `q`, затем `sort`.
- Для sort удобно сделать `field` + `direction`.
- Для `q` приводи строки к lower-case.
- Проверь `page` за пределами `totalPages`.

## Reference solution — complete TypeScript (Express or plain Node)
```ts
import express from "express";

type Item = {
  id: string;
  name: string;
  price: number;
  createdAt: string;
};

const items: Item[] = Array.from({ length: 57 }, (_, i) => ({
  id: String(i + 1),
  name: `Item ${i + 1}`,
  price: Math.floor(Math.random() * 500) + 10,
  createdAt: new Date(Date.now() - i * 60_000).toISOString(),
}));

const app = express();

function toPositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

app.get("/items", (req, res) => {
  const page = toPositiveInt(req.query.page as string | undefined, 1);
  const limit = Math.min(toPositiveInt(req.query.limit as string | undefined, 10), 100);
  const q = (req.query.q as string | undefined)?.trim().toLowerCase() || "";
  const sort = (req.query.sort as string | undefined) || "createdAt";

  let result = items.slice();

  if (q) {
    result = result.filter((it) => it.name.toLowerCase().includes(q));
  }

  const direction = sort.startsWith("-") ? -1 : 1;
  const field = (sort.startsWith("-") ? sort.slice(1) : sort) as keyof Item;
  const allowed: (keyof Item)[] = ["name", "price", "createdAt"];

  if (allowed.includes(field)) {
    result.sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av < bv) return -1 * direction;
      if (av > bv) return 1 * direction;
      return 0;
    });
  }

  const total = result.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * limit;
  const data = result.slice(offset, offset + limit);

  return res.json({
    data,
    meta: {
      page: safePage,
      limit,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  });
});

app.listen(3000, () => {
  console.log("Server on http://localhost:3000");
});
```

## Follow-up questions
- Когда offset-пагинация перестает быть эффективной?
- Как перейти на cursor-based pagination?
- Как задизайнить стабильный `sort` при равных значениях?
- Как избежать дублирования/пропуска записей при высоком update rate?
