# 02 — Express Rate Limiter Middleware

## Statement
Implement a custom rate limiter middleware for Express.

The middleware should:
- Track requests per client IP in memory.
- Allow up to `N` requests per `windowMs`.
- Return `429 Too Many Requests` when limit is exceeded.
- Set `Retry-After` header with seconds until reset.

You can use fixed window or sliding window strategy.

## Requirements
- Use TypeScript and Express.
- Use an in-memory `Map` keyed by IP.
- Add `Retry-After` response header for blocked requests.
- Keep middleware reusable (`rateLimiter({ limit, windowMs })`).
- Avoid third-party rate-limit libraries.

## Time box
35-50 minutes

## What interviewers look for (Что ищут)
- Понимание trade-off между fixed/sliding window.
- Корректный расчет окна и `Retry-After`.
- Чистый middleware API и читаемость кода.
- Осознание ограничений in-memory подхода в продакшене.

## Hints
- Для fixed window храни `count` и `resetAt` на IP.
- На каждом запросе проверяй, не истекло ли окно.
- `Retry-After` обычно в секундах (целое число).
- Не забудь про `req.ip` и ситуацию с proxy в реальном мире.

## Reference solution — complete TypeScript (Express or plain Node)
```ts
import express, { NextFunction, Request, Response } from "express";

type Bucket = {
  count: number;
  resetAt: number;
};

function rateLimiter(options: { limit: number; windowMs: number }) {
  const { limit, windowMs } = options;
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || "unknown";
    const now = Date.now();
    const current = buckets.get(ip);

    if (!current || current.resetAt <= now) {
      buckets.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= limit) {
      const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({
        error: "Too many requests",
        retryAfterSec,
      });
    }

    current.count += 1;
    buckets.set(ip, current);
    return next();
  };
}

const app = express();

app.set("trust proxy", true);
app.use(rateLimiter({ limit: 5, windowMs: 10_000 }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.listen(3000, () => {
  console.log("Server on http://localhost:3000");
});
```

## Follow-up questions
- Как реализовать sliding window или token bucket?
- Что произойдет при нескольких инстансах сервиса?
- Как перенести счетчики в Redis?
- Какие метрики и алерты добавить для мониторинга лимитера?
