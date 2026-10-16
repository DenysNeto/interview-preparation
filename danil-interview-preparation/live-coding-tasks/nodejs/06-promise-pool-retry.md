# 06 — Promise Pool + Retry with Exponential Backoff

## Statement
Implement two reusable utilities:

1. `promisePool<T, R>(items, worker, concurrency)`  
   Runs async jobs with limited concurrency and returns results in input order.

2. `withRetry<T>(fn, options)`  
   Retries a failing async function with exponential backoff.

Then combine them: process items in a pool, where each worker call is wrapped with retry.

## Requirements
- TypeScript generics.
- `promisePool` must respect max concurrency.
- Preserve result order.
- `withRetry` options:
  - `retries`
  - `baseDelayMs`
  - optional `shouldRetry(error, attempt)`

## Time box
45-60 minutes

## What interviewers look for (Что ищут)
- Контроль конкурентности без гонок и утечек промисов.
- Типобезопасный и переиспользуемый API.
- Корректный backoff и условия остановки retry.
- Умение балансировать простоту и надежность реализации.

## Hints
- Для pool можно держать `nextIndex` и запускать `workerLoop`.
- Результаты храни в массиве по индексу исходного item.
- Delay реализуется через `await new Promise(setTimeout)`.
- Не все ошибки стоит ретраить: добавь `shouldRetry`.

## Reference solution — complete TypeScript (Express or plain Node)
```ts
type RetryOptions = {
  retries: number;
  baseDelayMs: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { retries, baseDelayMs, shouldRetry } = options;
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      const canRetry = attempt < retries && (shouldRetry ? shouldRetry(error, attempt) : true);
      if (!canRetry) throw error;

      const delay = baseDelayMs * 2 ** attempt;
      await sleep(delay);
      attempt += 1;
    }
  }
}

export async function promisePool<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  if (concurrency <= 0) throw new Error("concurrency must be > 0");

  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function workerLoop(): Promise<void> {
    while (true) {
      const current = nextIndex;
      nextIndex += 1;
      if (current >= items.length) return;

      results[current] = await worker(items[current], current);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => workerLoop()
  );
  await Promise.all(workers);
  return results;
}

// Example
async function main() {
  const input = [1, 2, 3, 4, 5, 6];
  const out = await promisePool(
    input,
    (n) =>
      withRetry(
        async () => {
          if (Math.random() < 0.25) throw new Error("Transient failure");
          await sleep(50);
          return n * 10;
        },
        {
          retries: 3,
          baseDelayMs: 40,
          shouldRetry: (err) => String((err as Error).message).includes("Transient"),
        }
      ),
    3
  );

  console.log(out); // [10, 20, 30, 40, 50, 60] (if all eventually succeed)
}

main().catch(console.error);
```

## Follow-up questions
- Как добавить jitter к backoff и зачем?
- Что делать с частичными ошибками: fail-fast или collect-errors?
- Как отменять пул через `AbortSignal`?
- Где здесь возможен starvation и как его избежать?
