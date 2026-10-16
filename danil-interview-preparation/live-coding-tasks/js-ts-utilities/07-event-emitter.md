# Event Emitter

## Statement
Implement a typed `EventEmitter` class with methods: `on`, `off`, `emit`, and `once`.

## Requirements
- Generic event map typing:
  - event name -> payload type.
- `on(event, handler)` returns unsubscribe function.
- `off(event, handler)` removes a specific handler.
- `once(event, handler)` triggers only once.
- `emit(event, payload)` invokes all current listeners.

## Time box
20-25 minutes

## What interviewers look for (Что ищут)
- Дизайн простого, но расширяемого API.
- Корректную работу `once` без утечек.
- Безопасную типизацию событий и payload.
- Учет edge cases (удаление во время emit, порядок вызовов).

## Hints
- Храни `Map<event, Set<handler>>`.
- Для `emit` итерируйся по копии, чтобы изменения набора не ломали цикл.
- `once` можно сделать через обертку, снимающуюся из `off`.

## Reference solution — complete TypeScript
```ts
type EventMap = Record<string, unknown>;
type Handler<T> = (payload: T) => void;

export class EventEmitter<Events extends EventMap> {
  private listeners = new Map<keyof Events, Set<Handler<any>>>();

  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): () => void {
    const bucket = this.listeners.get(event) ?? new Set<Handler<Events[K]>>();
    bucket.add(handler);
    this.listeners.set(event, bucket as Set<Handler<any>>);
    return () => this.off(event, handler);
  }

  off<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void {
    const bucket = this.listeners.get(event);
    if (!bucket) return;
    bucket.delete(handler as Handler<any>);
    if (bucket.size === 0) {
      this.listeners.delete(event);
    }
  }

  once<K extends keyof Events>(event: K, handler: Handler<Events[K]>): () => void {
    const wrapped: Handler<Events[K]> = (payload) => {
      this.off(event, wrapped);
      handler(payload);
    };
    return this.on(event, wrapped);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const bucket = this.listeners.get(event);
    if (!bucket) return;
    // Snapshot to avoid mutation issues if handlers unsubscribe during emit.
    const snapshot = [...bucket] as Handler<Events[K]>[];
    for (const handler of snapshot) {
      handler(payload);
    }
  }
}

// Example:
type ChatEvents = {
  message: { from: string; text: string };
  joined: { userId: string };
};

const bus = new EventEmitter<ChatEvents>();
bus.on("message", (m) => console.log(m.text));
bus.emit("message", { from: "u1", text: "hello" });
```

## Follow-up questions
- Как добавить wildcard-события (`*`)?
- Нужна ли обработка ошибок в listener-ах внутри `emit`?
- Как сделать асинхронный emitter с `await` всех handlers?
