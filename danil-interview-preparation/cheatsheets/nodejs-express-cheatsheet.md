# Node.js + Express Cheatsheet

## Project skeleton (live coding)

```
src/
  app.ts
  routes/items.ts
  services/itemsService.ts
  middleware/errorHandler.ts
  middleware/auth.ts
  types.ts
```

## Minimal Express app

```ts
import express from 'express';
import { itemsRouter } from './routes/items';
import { errorHandler } from './middleware/errorHandler';

const app = express();
app.use(express.json());
app.use('/api/items', itemsRouter);
app.use(errorHandler);

app.listen(3000);
```

## Async error wrapper

```ts
import type { RequestHandler } from 'express';

export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
```

## Zod validation

```ts
import { z } from 'zod';

const CreateItemSchema = z.object({
  title: z.string().min(1).max(200),
  done: z.boolean().optional().default(false),
});

// in route:
const parsed = CreateItemSchema.safeParse(req.body);
if (!parsed.success) {
  return res.status(400).json({ error: parsed.error.flatten() });
}
```

## Error middleware

```ts
import type { ErrorRequestHandler } from 'express';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
};
```

## JWT auth middleware (sketch)

```ts
import jwt from 'jsonwebtoken';

type JwtPayload = { sub: string; role: 'user' | 'admin' };

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(...roles: Array<'user' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as JwtPayload | undefined;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

## Rate limiter (fixed window, in-memory)

```ts
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit({ windowMs, max }: { windowMs: number; max: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (entry.count >= max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ error: 'Too Many Requests' });
    }
    entry.count += 1;
    next();
  };
}
```

## Pagination helpers

```ts
const page = Math.max(1, Number(req.query.page) || 1);
const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
const offset = (page - 1) * limit;

const slice = items.slice(offset, offset + limit);
res.json({
  data: slice,
  page,
  limit,
  total: items.length,
  totalPages: Math.ceil(items.length / limit),
});
```

## TTL cache

```ts
class TtlCache<V> {
  private store = new Map<string, { value: V; expiresAt: number }>();

  constructor(private defaultTtlMs: number) {}

  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: V, ttlMs = this.defaultTtlMs) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}
```

## Promise pool + retry

```ts
async function promisePool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => run()),
  );
  return results;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  { retries = 3, baseMs = 200 }: { retries?: number; baseMs?: number } = {},
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt === retries) break;
      await new Promise((r) => setTimeout(r, baseMs * 2 ** attempt));
    }
  }
  throw lastErr;
}
```

## Streams (CSV line transform sketch)

```ts
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

async function processCsv(path: string) {
  const rl = createInterface({
    input: createReadStream(path),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    // transform line
  }
}
```

## Status codes cheat

| Code | When |
| --- | --- |
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Validation |
| 401 | Unauthenticated |
| 403 | Forbidden |
| 404 | Not found |
| 429 | Rate limited |
| 500 | Unexpected |

## Event loop (one-liner for interviews)

Call stack → microtasks (`Promise`, `queueMicrotask`) → next timers / I/O / setImmediate. Не блокируй event loop тяжёлым sync CPU.
