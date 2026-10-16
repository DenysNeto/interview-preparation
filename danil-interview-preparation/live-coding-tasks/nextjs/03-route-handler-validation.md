# Route Handler with Zod Validation

## Statement
Create an API route handler in App Router at `app/api/products/route.ts`:
- `GET` should return product list.
- `POST` should validate input with Zod and create a new product.
- Return JSON responses with `NextResponse`.

## Requirements
- Implement `GET` and `POST` in one `route.ts` file.
- Validate `POST` payload with Zod (`name`, `price`).
- Return meaningful status codes (`200`, `201`, `400`).
- Return validation details on bad input.
- Keep implementation strongly typed.

## Time box
30-40 minutes

## What interviewers look for (Что ищут)
- Понимание App Router Route Handlers (`app/api/.../route.ts`).
- Умение валидировать входные данные до бизнес-логики.
- Корректные HTTP-статусы и консистентный JSON-формат ответа.
- Аккуратную работу с ошибками парсинга/валидации.
- Базовую безопасность (не доверять `req.json()` без проверки).

## Hints
- Используй `safeParse`, чтобы не ловить исключения от `parse`.
- Схему Zod лучше вынести в константу рядом с handler.
- В error-ответе полезно вернуть `fieldErrors` для клиента.

## Reference solution — App Router TypeScript code (show file paths as comments)
```ts
// app/api/products/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

type Product = {
  id: number;
  name: string;
  price: number;
};

const createProductSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  price: z.number().positive("Price must be greater than 0"),
});

const products: Product[] = [
  { id: 1, name: "Keyboard", price: 99 },
  { id: 2, name: "Mouse", price: 49 },
];

export async function GET() {
  return NextResponse.json({ data: products }, { status: 200 });
}

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const result = createProductSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: result.error.flatten(),
      },
      { status: 400 },
    );
  }

  const newProduct: Product = {
    id: products.length + 1,
    name: result.data.name,
    price: result.data.price,
  };

  products.push(newProduct);

  return NextResponse.json({ data: newProduct }, { status: 201 });
}
```

## Follow-up questions
- Чем `NextResponse.json()` отличается от обычного `Response.json()` в контексте Next?
- Как обработать конкурентные запросы на создание (race condition) в реальном backend?
- Где лучше хранить схему: рядом с route или в shared `lib/validation`?
- Как бы ты добавил `PUT` и `DELETE` для конкретного `id`?
