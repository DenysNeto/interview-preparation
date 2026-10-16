# 05 — Generic TTL Cache in TypeScript

## Statement
Implement a generic in-memory TTL cache:

`class TtlCache<V>`
- `set(key: string, value: V, ttlMs: number): void`
- `get(key: string): V | undefined`
- `delete(key: string): boolean`
- Optional: `getOrSet(key, ttlMs, factory)`

Rules:
- Expired values should not be returned.
- Expired entries should be cleaned up when accessed.

## Requirements
- TypeScript generics.
- In-memory storage with `Map`.
- `get` removes expired entries lazily.
- `getOrSet` should support async factory.

## Time box
30-45 minutes

## What interviewers look for (Что ищут)
- Умение проектировать generic API в TS.
- Корректная логика TTL и очистки протухших ключей.
- Понимание lazy cleanup vs background cleanup.
- Продуманные edge cases (`ttlMs <= 0`, race в `getOrSet`).

## Hints
- Храни `{ value, expiresAt }` в `Map`.
- Сравнивай `Date.now()` с `expiresAt` в `get`.
- Для `getOrSet` сначала попробуй `get`, потом вызови `factory`.
- Можно добавить `size()` для удобства отладки.

## Reference solution — complete TypeScript (Express or plain Node)
```ts
type CacheEntry<V> = {
  value: V;
  expiresAt: number;
};

export class TtlCache<V> {
  private readonly store = new Map<string, CacheEntry<V>>();

  set(key: string, value: V, ttlMs: number): void {
    const expiresAt = Date.now() + Math.max(0, ttlMs);
    this.store.set(key, { value, expiresAt });
  }

  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  size(): number {
    return this.store.size;
  }

  async getOrSet(
    key: string,
    ttlMs: number,
    factory: () => Promise<V> | V
  ): Promise<V> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const value = await factory();
    this.set(key, value, ttlMs);
    return value;
  }
}

// Example usage
async function demo() {
  const cache = new TtlCache<number>();

  cache.set("a", 123, 1000);
  console.log(cache.get("a")); // 123

  const v = await cache.getOrSet("b", 5000, async () => 42);
  console.log(v); // 42
}

demo();
```

## Follow-up questions
- Как добавить periodic cleanup без сильного overhead?
- Как избежать stampede при параллельных `getOrSet` одного ключа?
- Какие eviction-policy нужны помимо TTL (LRU/LFU)?
- Как сделать thread-safe/shared cache в multi-process среде?
