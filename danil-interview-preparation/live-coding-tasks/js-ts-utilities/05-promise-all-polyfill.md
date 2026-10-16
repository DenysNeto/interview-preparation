# Promise.all Polyfill

## Statement
Implement a TypeScript version of `Promise.all` behavior as `promiseAll`. It should resolve when all inputs resolve, and reject immediately when any input rejects.

## Requirements
- Accept an array/tuple of values or promises.
- Preserve result order by input index.
- Resolve to typed tuple/array values.
- Reject fast on first rejection.

## Time box
20-25 minutes

## What interviewers look for (Что ищут)
- Понимание жизненного цикла промисов и fail-fast поведения.
- Корректную работу с `Promise.resolve` для непромисов.
- Сохранение порядка результатов при разной скорости завершения.
- Типизацию с `Awaited<T>`.

## Hints
- Веди счетчик `resolvedCount`.
- Результаты записывай по индексу, а не `push`.
- Пустой массив должен резолвиться сразу.

## Reference solution — complete TypeScript
```ts
export function promiseAll<T extends readonly unknown[]>(
  values: [...T]
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  return new Promise((resolve, reject) => {
    if (values.length === 0) {
      resolve([] as unknown as { [K in keyof T]: Awaited<T[K]> });
      return;
    }

    const results: Partial<{ [K in keyof T]: Awaited<T[K]> }> = [];
    let resolvedCount = 0;
    let settled = false;

    values.forEach((value, index) => {
      Promise.resolve(value)
        .then((resolvedValue) => {
          if (settled) return;
          results[index as keyof T] = resolvedValue as Awaited<T[typeof index]>;
          resolvedCount += 1;

          if (resolvedCount === values.length) {
            settled = true;
            resolve(results as { [K in keyof T]: Awaited<T[K]> });
          }
        })
        .catch((error) => {
          if (settled) return;
          settled = true;
          reject(error);
        });
    });
  });
}

// Example:
async function demo() {
  const data = await promiseAll([
    Promise.resolve(42),
    "ok",
    new Promise<string>((res) => setTimeout(() => res("done"), 50)),
  ] as const);

  // data inferred as readonly [42, "ok", "done"]-like value types
  console.log(data);
}
```

## Follow-up questions
- Почему важно "отписаться" от дальнейших результатов после reject?
- Как реализовать ограничение параллелизма (concurrency limit)?
- Чем `Promise.all` отличается от `Promise.allSettled`?
