# Final-Day Cheatsheet

Read this 20 min before. No new topics.

## Coralogix in one breath

In-stream analytics (Streama) + data in customer's own storage → full observability at much lower cost. Squad owns **Explore, APM, RUM** in **Angular**. They want builders: ownership, product sense, architecture, performance with big data, mentoring, AI-assisted dev.

## Angular in 10 lines

1. Standalone components, `imports` in decorator; `input()`, `output()`, `model()`, `viewChild()`.
2. Signals: `signal`, `computed` (derive), `effect` (sync to outside world only), `linkedSignal`, `untracked`.
3. Control flow: `@if`, `@for (x of xs; track x.id)`, `@switch`, `@defer (on viewport)`, `@let`.
4. DI: `inject()`; root vs route vs component providers; `InjectionToken`; `useClass/useValue/useFactory/useExisting/multi`.
5. Change detection: Zone triggers top-down checks → OnPush (inputs ref, events, async pipe, signals) → zoneless (signals/markForCheck schedule CD).
6. Perf: OnPush + immutable, `track`, no template method calls (pure pipes / computed), virtual scroll, `@defer`, `runOutsideAngular` for hot events, workers.
7. RxJS: `switchMap` (search) / `mergeMap` (parallel) / `concatMap` (ordered writes) / `exhaustMap` (ignore while busy). `catchError` inside the flattening op.
8. Leaks: `async` pipe / `toSignal` / `takeUntilDestroyed()` last in pipe; no nested subscribes; `shareReplay({ bufferSize: 1, refCount: true })`.
9. Router: `loadComponent`/`loadChildren`, functional guards, `withComponentInputBinding`, URL query params as state.
10. Forms: typed reactive forms, `ControlValueAccessor` for custom inputs; interceptors are functions (`HttpInterceptorFn`).

## State answer

URL (shareable: query, range, filters) · server cache (cancel, dedupe, SWR) · feature store (signals service or SignalStore, scoped via providers) · local UI signals · global (user, flags). NgRx Store when many features react to the same events / need devtools / large team.

## Big-data UI answer

Measure first (network → parse → framework → DOM → memory). Virtualize, paginate with cursors, server-side aggregation & downsampling (min/max keeps spikes), canvas for big charts, workers for heavy compute, batch streaming updates (`bufferTime`), cap buffers, cancel stale queries, keep previous results visible, measure in production (INP, time-to-first-row).

## System design: RADIO

Requirements (ask numbers!) → Architecture (boxes + state + data flow) → Data model (state shape, URL) → Interface (API, pagination, streaming, errors) → Optimizations (perf, UX, resilience, a11y, security/XSS from logs, testing, rollout with flags, success metrics).

## Live coding ritual

Restate → clarify edge cases → plan in 3–5 steps → working minimum → loading/error/empty → cleanup/cancellation → types at boundaries → summarize what you'd do next (tests, a11y, perf).

## Behavioral

STAR, "I" not "we", numbers, a short reflection. Ready: tell me about yourself (90 s), why Coralogix (60 s), 8 stories, AI workflow answer, 5 questions to ask.

## Mindset

They're evaluating how you think and collaborate, not perfection. Ask, reason out loud, state trade-offs, connect tech decisions to the user debugging an incident at 3 a.m.
