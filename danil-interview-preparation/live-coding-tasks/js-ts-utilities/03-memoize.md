# Memoize Utility

## Statement
Implement a strongly typed `memoize` utility for pure functions. It should cache results by arguments and return cached values for repeated calls.

## Requirements
- Preserve parameter and return types.
- Allow custom `resolver` to build cache keys.
- Default key strategy should work for primitive arguments.
- Expose `clear()` method.

## Time box
15-20 minutes

## What interviewers look for (Что ищут)
- Понимание trade-off между скоростью и потреблением памяти.
- Умение проектировать API с расширяемостью (`resolver`).
- Типобезопасность без потери удобства.
- Осознание ограничений ключей по умолчанию.

## Hints
- Для простого кейса можно использовать `Map<string, R>`.
- Ключ по умолчанию: `args.join("|")` подходит только для примитивов.
- В реальных задачах важны `WeakMap`/вложенные `Map` для объектов.

## Reference solution — complete TypeScript
```ts
type AnyFn = (...args: any[]) => any;

type Memoized<F extends AnyFn> = F & {
  clear: () => void;
};

export function memoize<F extends AnyFn>(
  fn: F,
  resolver?: (...args: Parameters<F>) => string
): Memoized<F> {
  const cache = new Map<string, ReturnType<F>>();
  const keyFn =
    resolver ??
    ((...args: Parameters<F>) =>
      args
        .map((arg) => {
          if (arg === null) return "null";
          if (arg === undefined) return "undefined";
          if (typeof arg === "object") return JSON.stringify(arg);
          return String(arg);
        })
        .join("|"));

  const memoized = ((...args: Parameters<F>): ReturnType<F> => {
    const key = keyFn(...args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as Memoized<F>;

  memoized.clear = () => {
    cache.clear();
  };

  return memoized;
}

// Example:
const fib = memoize((n: number): number => {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
});
```

## Follow-up questions
- Как безопасно мемоизировать функции с аргументами-объектами?
- В чем разница между `Map` и `WeakMap` для кэша?
- Когда мемоизация может ухудшить производительность?
