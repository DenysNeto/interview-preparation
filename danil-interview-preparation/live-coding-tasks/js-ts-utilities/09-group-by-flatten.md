# groupBy + flatten Utilities

## Statement
Implement two utility functions in TypeScript:
1) `groupBy` — groups array items by key selector.
2) `flatten` — flattens nested arrays (optionally by depth).

## Requirements
- `groupBy<T, K extends PropertyKey>(items, getKey)` returns `Record<K, T[]>`.
- `flatten<T>(input, depth = Infinity)` supports deeply nested arrays.
- Keep runtime complexity reasonable and implementation clean.

## Time box
20-25 minutes

## What interviewers look for (Что ищут)
- Умение писать универсальные утилиты с дженериками.
- Четкий контроль глубины рекурсии для `flatten`.
- Понимание компромиссов типов для deeply nested массивов.
- Читаемость и тестируемость решения.

## Hints
- Для `groupBy` достаточно одного прохода по массиву.
- Для `flatten` удобно написать внутреннюю рекурсивную функцию.
- При `depth = 0` верни поверхностную копию.

## Reference solution — complete TypeScript
```ts
export function groupBy<T, K extends PropertyKey>(
  items: T[],
  getKey: (item: T) => K
): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const key = getKey(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

type NestedArray<T> = Array<T | NestedArray<T>>;

export function flatten<T>(input: NestedArray<T>, depth: number = Infinity): T[] {
  if (depth < 0) {
    throw new Error("depth must be >= 0");
  }

  const result: T[] = [];

  const walk = (arr: NestedArray<T>, currentDepth: number) => {
    for (const item of arr) {
      if (Array.isArray(item) && currentDepth < depth) {
        walk(item, currentDepth + 1);
      } else {
        result.push(item as T);
      }
    }
  };

  walk(input, 0);
  return result;
}

// Example:
const users = [
  { id: 1, team: "A" },
  { id: 2, team: "B" },
  { id: 3, team: "A" },
];
const grouped = groupBy(users, (u) => u.team);

const flat = flatten<number>([1, [2, [3, 4]], 5], 2);
console.log(grouped, flat);
```

## Follow-up questions
- Как типизировать `flatten` так, чтобы вывод зависел от `depth`?
- Что лучше по памяти: рекурсия или стек вручную?
- Как оптимизировать `groupBy` для очень больших потоков данных?
