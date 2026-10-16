# Promise.allSettled Polyfill

## Statement
Implement `promiseAllSettled` in TypeScript. It should wait for all promises/values and return each outcome as `fulfilled` or `rejected`.

## Requirements
- Accept array/tuple of values and/or promises.
- Always resolve (never reject).
- Preserve input order.
- Return typed settled result objects.

## Time box
15-20 minutes

## What interviewers look for (Что ищут)
- Четкое различие между `all` и `allSettled`.
- Корректную нормализацию входов через `Promise.resolve`.
- Аккуратные типы для `fulfilled/rejected` результатов.
- Предсказуемое поведение на смешанных входных данных.

## Hints
- Для каждого элемента обработай `then` и `catch`.
- Сохраняй в результирующем массиве именно по индексу.
- Резолв итогового промиса, когда счетчик достиг длины входа.

## Reference solution — complete TypeScript
```ts
type SettledResult<T> =
  | { status: "fulfilled"; value: T }
  | { status: "rejected"; reason: unknown };

export function promiseAllSettled<T extends readonly unknown[]>(
  values: [...T]
): Promise<{ [K in keyof T]: SettledResult<Awaited<T[K]>> }> {
  return new Promise((resolve) => {
    if (values.length === 0) {
      resolve([] as unknown as { [K in keyof T]: SettledResult<Awaited<T[K]>> });
      return;
    }

    const results: Partial<{ [K in keyof T]: SettledResult<Awaited<T[K]>> }> = [];
    let settledCount = 0;

    values.forEach((value, index) => {
      Promise.resolve(value)
        .then((resolvedValue) => {
          results[index as keyof T] = {
            status: "fulfilled",
            value: resolvedValue as Awaited<T[typeof index]>,
          };
        })
        .catch((reason) => {
          results[index as keyof T] = {
            status: "rejected",
            reason,
          };
        })
        .finally(() => {
          settledCount += 1;
          if (settledCount === values.length) {
            resolve(results as { [K in keyof T]: SettledResult<Awaited<T[K]>> });
          }
        });
    });
  });
}
```

## Follow-up questions
- Где `allSettled` лучше, чем `all`, в реальном продукте?
- Как построить retriable pipeline на основе `allSettled`?
- Какие преимущества дает discriminated union по `status`?
