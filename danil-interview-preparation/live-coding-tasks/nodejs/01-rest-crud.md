# 01 — Express REST CRUD (Items)

## Statement
Build a small REST API for managing items.

Each item has:
- `id: string`
- `name: string`
- `price: number`
- `createdAt: string` (ISO datetime)

Implement routes:
- `GET /items`
- `POST /items`
- `GET /items/:id`
- `PATCH /items/:id`
- `DELETE /items/:id`

Data can be stored in-memory (`Map` or array). No database is required.

## Requirements
- Use TypeScript.
- Use Express.
- Validate request payloads with Zod.
- Implement a reusable `asyncHandler`.
- Implement centralized error middleware.
- Return proper HTTP codes (`200`, `201`, `204`, `400`, `404`).

## Time box
45-60 minutes

## What interviewers look for (Что ищут)
- Четкая структура Express-приложения: роуты, валидация, ошибки.
- Понимание REST-семантики и корректных HTTP-кодов.
- Аккуратная работа с типами TypeScript и DTO.
- Умение писать читаемый, расширяемый код без оверинжиниринга.

## Hints
- Начни с типов `Item`, `CreateItemInput`, `PatchItemInput`.
- Сделай `Map<string, Item>` для O(1) доступа по `id`.
- Вынеси `parse` Zod-схем в middleware или внутрь хендлеров.
- Error middleware должен уметь обрабатывать `ZodError`.

## Reference solution — complete TypeScript (Express or plain Node)
```ts
import express, { NextFunction, Request, Response } from "express";
import { z, ZodError } from "zod";
import { randomUUID } from "crypto";

type Item = {
  id: string;
  name: string;
  price: number;
  createdAt: string;
};

const createItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});

const patchItemSchema = z
  .object({
    name: z.string().min(1).optional(),
    price: z.number().positive().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field must be provided",
  });

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const app = express();
app.use(express.json());

const items = new Map<string, Item>();

app.get(
  "/items",
  asyncHandler(async (_req, res) => {
    res.json([...items.values()]);
  })
);

app.post(
  "/items",
  asyncHandler(async (req, res) => {
    const input = createItemSchema.parse(req.body);
    const item: Item = {
      id: randomUUID(),
      name: input.name,
      price: input.price,
      createdAt: new Date().toISOString(),
    };
    items.set(item.id, item);
    res.status(201).json(item);
  })
);

app.get(
  "/items/:id",
  asyncHandler(async (req, res) => {
    const item = items.get(req.params.id);
    if (!item) throw new HttpError(404, "Item not found");
    res.json(item);
  })
);

app.patch(
  "/items/:id",
  asyncHandler(async (req, res) => {
    const item = items.get(req.params.id);
    if (!item) throw new HttpError(404, "Item not found");
    const patch = patchItemSchema.parse(req.body);
    const updated: Item = { ...item, ...patch };
    items.set(updated.id, updated);
    res.json(updated);
  })
);

app.delete(
  "/items/:id",
  asyncHandler(async (req, res) => {
    const existed = items.delete(req.params.id);
    if (!existed) throw new HttpError(404, "Item not found");
    res.status(204).send();
  })
);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.flatten(),
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

## Follow-up questions
- Как вынести валидацию и сериализацию в отдельный слой?
- Что изменится при переходе на PostgreSQL?
- Где и как добавить idempotency для `POST /items`?
- Как покрыть этот API интеграционными тестами?
