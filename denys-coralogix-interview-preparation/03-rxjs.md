# RxJS for Angular Interviews

Large Angular codebases (Coralogix's included) are RxJS-heavy even as signals arrive. Expect at least one question on flattening operators and one on leaks.

Promises and the event loop are in [async-js/asynchronous-javascript.md](../async-js/asynchronous-javascript.md) — not repeated here.

---

## 1. Mental model

- **Observable** = lazy push collection of values over time. Nothing happens until `subscribe`.
- **Observer** = `{ next, error, complete }`. After `error` or `complete`, no more values.
- **Subscription** = handle to stop (`unsubscribe()`), runs teardown (cancel XHR, clear interval, remove listener).
- **Operators** = pure functions `Observable → Observable`, composed with `pipe`.

| | Promise | Observable |
| --- | --- | --- |
| Values | One | Zero to many |
| Eager/lazy | Eager | Lazy |
| Cancellable | No (needs AbortController) | Yes (unsubscribe) |
| Multicast | Yes (shared result) | Cold by default (each subscriber gets own execution) |
| Operators | `then` only | Hundreds |

**Cold vs hot:** cold = producer created per subscriber (HttpClient, `interval`, `of`). Hot = producer exists independently (DOM events, Subjects, WebSocket shared). `share()` / `shareReplay()` turn cold into hot (multicast).

## 2. Flattening operators (most asked)

When each outer value starts an inner Observable (usually an HTTP call):

| Operator | Behavior | Use in observability UI |
| --- | --- | --- |
| `switchMap` | Cancel previous inner, keep latest | Search / query execution, typeahead, route param → fetch |
| `mergeMap` | Run all in parallel | Fetch details for many independent widgets; optional `concurrent` limit |
| `concatMap` | Queue, one at a time, in order | Saving edits in order, sequential mutations |
| `exhaustMap` | Ignore new while one is running | "Run query" button double-clicks, login submit, refresh |

Say the failure mode: `mergeMap` for search → **race condition**, an older slow response overwrites a newer one. `switchMap` for saves → **lost writes** (cancelled request may already have reached the server).

## 3. Operators you must write without thinking

```ts
// creation
of, from, fromEvent, interval, timer, defer, EMPTY, throwError
// combination
combineLatest([a$, b$])   // latest from each, after all emitted once
withLatestFrom(b$)        // on a$ emission, sample b$
forkJoin([a$, b$])        // wait for all to complete (like Promise.all)
merge(a$, b$)             // interleave
zip                       // pair by index
// filtering / rate limiting
filter, take, takeUntil, first, skip, distinctUntilChanged, debounceTime, throttleTime, auditTime, sampleTime
// transform
map, scan (reduce over time), bufferTime (batch websocket messages), pairwise, startWith
// errors
catchError, retry({ count: 3, delay: (err, i) => timer(2 ** i * 500) })
// side effects / lifecycle
tap, finalize
// multicasting
share, shareReplay({ bufferSize: 1, refCount: true })
```

## 4. Subjects

| Type | Behavior | Typical use |
| --- | --- | --- |
| `Subject` | No initial value, only future emissions | Event bus, "refresh" trigger |
| `BehaviorSubject` | Requires initial value, replays last to new subscribers, `.value` | Pre-signals state in services |
| `ReplaySubject(n)` | Replays last n | Caches, late subscribers |
| `AsyncSubject` | Emits last value on complete | Rare |

Expose read-only: `private state$ = new BehaviorSubject(x); readonly state = this.state$.asObservable();`. Today prefer `signal` for state.

## 5. Patterns you will be asked to code

**Typeahead**

```ts
results = toSignal(
  this.queryControl.valueChanges.pipe(
    map(q => q.trim()),
    debounceTime(250),
    distinctUntilChanged(),
    filter(q => q.length >= 2),
    switchMap(q =>
      this.api.suggest(q).pipe(
        map(items => ({ status: 'success' as const, items })),
        catchError(() => of({ status: 'error' as const, items: [] })),
        startWith({ status: 'loading' as const, items: [] }),
      ),
    ),
  ),
  { initialValue: { status: 'idle' as const, items: [] } },
);
```

Note `catchError` **inside** `switchMap`: if it's outside, one failure completes the outer stream and the search stops working forever. Classic bug — say it out loud.

**Polling with pause when tab hidden + backoff**

```ts
const visible$ = fromEvent(document, 'visibilitychange').pipe(
  startWith(null),
  map(() => document.visibilityState === 'visible'),
  distinctUntilChanged(),
);

const poll$ = visible$.pipe(
  switchMap(visible => (visible ? timer(0, 10_000) : EMPTY)),
  exhaustMap(() => this.api.getServiceHealth()),     // skip tick if previous call still running
  retry({ delay: (_err, attempt) => timer(Math.min(30_000, 1000 * 2 ** attempt)) }),
  shareReplay({ bufferSize: 1, refCount: true }),
);
```

**Live tail over WebSocket with batching** (avoid change detection per message)

```ts
const messages$ = webSocket<LogEntry>('wss://…/tail');
const batches$ = messages$.pipe(
  bufferTime(250),                                   // ≤ 4 UI updates per second
  filter(batch => batch.length > 0),
  scan((acc, batch) => [...batch.reverse(), ...acc].slice(0, 5000), [] as LogEntry[]),
);
```

**Query execution with refresh trigger**

```ts
private refresh$ = new Subject<void>();
results$ = combineLatest([this.query$, this.timeRange$, this.refresh$.pipe(startWith(undefined))]).pipe(
  debounceTime(0),                                   // coalesce simultaneous changes
  switchMap(([q, range]) => this.api.search(q, range)),
);
```

## 6. Leaks and unsubscribing

- `async` pipe / `toSignal` → unsubscribes automatically on destroy.
- `takeUntilDestroyed(this.destroyRef)` (or with no arg in injection context). Put it **last** in the pipe (after `switchMap`, otherwise inner subscriptions can survive).
- Avoid **nested subscribe** (`subscribe` inside `subscribe`) → use flattening operators; nested subscribes leak and lose cancellation.
- `shareReplay(1)` without `refCount: true` keeps the source subscribed forever after first subscriber — leak for long-lived sources (fine for one-shot HTTP caches).
- Things that never complete: store selects, `fromEvent`, `interval`, router events, `valueChanges`, Subjects, websockets.

## 7. Signals interop

```ts
import { toSignal, toObservable, takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';

query = signal('');
results = toSignal(
  toObservable(this.query).pipe(debounceTime(300), switchMap(q => this.api.search(q))),
  { initialValue: [] },
);
```

- `toSignal` subscribes immediately (in injection context) and unsubscribes on destroy. Without `initialValue` the type includes `undefined`. `requireSync: true` for BehaviorSubject-like sources.
- `toObservable` emits via an effect → asynchronous, coalesced (not every intermediate `set`).
- `rxResource({ params: () => ({ q: this.query() }), stream: ({ params }) => this.api.search(params.q) })` — signal-driven, Observable-backed loader (exact option names changed between versions; know the concept).

## 8. Error handling strategy (senior answer)

- Per-request: `catchError` inside the flattening operator → map to a UI state (`{ status: 'error' }`), keep the outer stream alive.
- Retries: only idempotent GETs, exponential backoff with jitter, cap attempts, don't retry 4xx.
- Global: interceptor for auth/toasts, `ErrorHandler` for uncaught errors → telemetry.
- Never swallow silently — log to monitoring with context (query, time range, traceId).

## 9. Testing RxJS

- Simple cases: `fakeAsync` + `tick(300)` for `debounceTime`, or Vitest/Jest fake timers.
- Marble testing with `TestScheduler`:

```ts
testScheduler.run(({ cold, expectObservable }) => {
  const input$ = cold('a-b-c---|');
  expectObservable(input$.pipe(debounceTime(2))).toBe('-------c|');
});
```

---

## Must-explain questions

1. Difference between `switchMap`, `mergeMap`, `concatMap`, `exhaustMap` — and one bug each causes when misused.
2. Why does my search stop working after one failed request? (`catchError` placement.)
3. Cold vs hot; what does `shareReplay` do and what's the `refCount` gotcha?
4. `combineLatest` vs `forkJoin` vs `withLatestFrom`.
5. How do you prevent leaks in a component? (async pipe/toSignal, takeUntilDestroyed last, no nested subscribes.)
6. How would you render a live tail with 2,000 logs/second without freezing the UI? (bufferTime batching, cap list size, virtual scroll, run socket outside Angular zone in Zone apps, pause button, "N new logs" indicator instead of auto-scroll when user scrolled up.)
7. When would you choose signals over BehaviorSubject today?
