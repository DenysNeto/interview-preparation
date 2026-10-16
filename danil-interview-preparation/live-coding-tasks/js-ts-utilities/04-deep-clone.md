# Deep Clone Utility

## Statement
Implement a `deepClone` function in TypeScript that recursively clones arrays and plain objects and safely handles circular references.

## Requirements
- Correctly clone:
  - primitives
  - arrays
  - plain objects
  - `Date`
- Preserve circular references.
- Do not mutate source values.
- Keep implementation readable and interview-friendly.

## Time box
20-25 minutes

## What interviewers look for (Что ищут)
- Понимание рекурсии и структуры данных.
- Обработку циклических ссылок через `WeakMap`.
- Корректный порядок проверки типов.
- Осознание ограничений (функции, class instances, Map/Set и т.д.).

## Hints
- База рекурсии: примитивы и `null`.
- Для циклов используй `WeakMap<object, any>`.
- `Date` клонируй через `new Date(date.getTime())`.

## Reference solution — complete TypeScript
```ts
type Cloneable =
  | null
  | undefined
  | string
  | number
  | boolean
  | bigint
  | symbol
  | Date
  | Cloneable[]
  | { [key: string]: Cloneable };

export function deepClone<T extends Cloneable>(
  value: T,
  seen: WeakMap<object, any> = new WeakMap()
): T {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as T;
  }

  if (seen.has(value)) {
    return seen.get(value);
  }

  if (Array.isArray(value)) {
    const clonedArr: Cloneable[] = [];
    seen.set(value, clonedArr);
    for (const item of value) {
      clonedArr.push(deepClone(item, seen));
    }
    return clonedArr as T;
  }

  const clonedObj: Record<string, Cloneable> = {};
  seen.set(value, clonedObj);

  for (const key of Object.keys(value)) {
    const obj = value as Record<string, Cloneable>;
    clonedObj[key] = deepClone(obj[key], seen);
  }

  return clonedObj as T;
}

// Example with circular refs:
const user: any = { name: "Danil", meta: { role: "dev" } };
user.self = user;
const cloned = deepClone(user);
console.log(cloned !== user, cloned.self === cloned); // true true
```

## Follow-up questions
- Чем `structuredClone` отличается от самописного deep clone?
- Какие типы стоит добавить в прод-версии (`Map`, `Set`, `RegExp`)?
- Как протестировать корректность на циклических графах?
