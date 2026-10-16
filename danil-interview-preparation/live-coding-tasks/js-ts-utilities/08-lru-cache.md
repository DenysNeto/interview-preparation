# LRU Cache (Map-based)

## Statement
Implement an `LRUCache<K, V>` class with fixed capacity using `Map`.

## Requirements
- Constructor accepts positive integer `capacity`.
- Methods:
  - `get(key): V | undefined` (marks key as most recently used)
  - `set(key, value): void` (insert/update and evict LRU if needed)
  - `has(key): boolean`
  - `size(): number`
- Must keep O(1) average operations.

## Time box
20-25 minutes

## What interviewers look for (Что ищут)
- Понимание идеи LRU и инвариантов структуры.
- Эффективную реализацию через порядок `Map`.
- Корректное вытеснение "самого старого" ключа.
- Чистую обработку обновления существующего ключа.

## Hints
- В `Map` порядок итерации соответствует порядку вставки.
- Чтобы "освежить" ключ: `delete` + `set`.
- LRU-ключ — первый в `map.keys().next().value`.

## Reference solution — complete TypeScript
```ts
export class LRUCache<K, V> {
  private readonly capacity: number;
  private readonly map = new Map<K, V>();

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error("capacity must be a positive integer");
    }
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key)!;
    // Refresh recency.
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    }
    this.map.set(key, value);

    if (this.map.size > this.capacity) {
      const lruKey = this.map.keys().next().value as K | undefined;
      if (lruKey !== undefined) {
        this.map.delete(lruKey);
      }
    }
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  size(): number {
    return this.map.size;
  }
}

// Example:
const cache = new LRUCache<string, number>(2);
cache.set("a", 1);
cache.set("b", 2);
cache.get("a"); // refresh "a"
cache.set("c", 3); // evicts "b"
console.log(cache.has("b")); // false
```

## Follow-up questions
- Как сделать TTL + LRU вместе?
- Когда стоит предпочесть LFU вместо LRU?
- Какие concurrency-проблемы возникнут в многопоточном окружении?
