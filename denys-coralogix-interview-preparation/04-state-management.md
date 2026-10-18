# State Management in Angular

Senior question format: "How would you manage state for the Explore page?" They want **categories of state**, **where each lives**, and **why**, not "I'd use NgRx".

---

## 1. Classify state first (say this framework out loud)

| Kind | Example in Explore/APM/RUM | Where it lives |
| --- | --- | --- |
| **URL state** | query, time range, filters, selected log id, visible columns | Router query params — shareable links are a core feature for incident investigation |
| **Server cache** | search results, facet counts, service list, trace by id | Data layer with caching, dedup, cancellation (service + signals, `httpResource`, NgRx, TanStack Query) |
| **Feature/UI state** | drawer open, column widths, row expanded, tab | Component signals or a component-scoped store |
| **Global client state** | user, permissions, team/org, feature flags, theme | Root services / root store |
| **Persisted preferences** | saved views, default columns, timezone | Backend (user settings) + local cache |
| **Form state** | alert builder, query editor draft | Reactive forms / signal forms |

Rule: **single source of truth per piece of state**; derive everything else (`computed`, selectors). Never copy URL state into a store and let both drift — read from one, write through one.

## 2. Option A — signal-based service store (default for most features)

```ts
type Status<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

@Injectable()                                         // provided per page/route, not root
export class ExploreStore {
  private api = inject(LogsApi);

  private readonly _filters = signal<ExploreFilters>({ query: '', severities: [], range: { kind: 'relative', minutes: 15 } });
  private readonly _results = signal<Status<LogEntry[]>>({ status: 'idle' });

  readonly filters = this._filters.asReadonly();
  readonly results = this._results.asReadonly();
  readonly logs = computed(() => {
    const r = this._results();
    return r.status === 'success' ? r.data : [];
  });
  readonly errorCount = computed(() => this.logs().filter(l => l.severity === 'error').length);

  constructor() {
    toObservable(this._filters)
      .pipe(
        debounceTime(200),
        tap(() => this._results.set({ status: 'loading' })),
        switchMap(f =>
          this.api.search(f).pipe(
            map(data => ({ status: 'success', data }) as const),
            catchError(e => of({ status: 'error', error: String(e.message ?? e) } as const)),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(r => this._results.set(r));
  }

  setQuery(query: string) {
    this._filters.update(f => ({ ...f, query }));
  }
  toggleSeverity(s: Severity) {
    this._filters.update(f => ({
      ...f,
      severities: f.severities.includes(s) ? f.severities.filter(x => x !== s) : [...f.severities, s],
    }));
  }
}
```

Why it's good: tiny, typed, testable, scoped (`providers: [ExploreStore]` on the route/component → destroyed when leaving), discriminated union makes impossible states impossible.

Limits: no devtools/time travel, conventions depend on discipline, cross-feature coordination gets ad hoc as the app grows.

## 3. Option B — NgRx Store (Redux)

```ts
export const ExploreActions = createActionGroup({
  source: 'Explore',
  events: {
    'Query Changed': props<{ query: string }>(),
    'Search Succeeded': props<{ logs: LogEntry[] }>(),
    'Search Failed': props<{ error: string }>(),
  },
});

export const exploreFeature = createFeature({
  name: 'explore',
  reducer: createReducer(
    initialState,
    on(ExploreActions.queryChanged, (s, { query }) => ({ ...s, query, loading: true })),
    on(ExploreActions.searchSucceeded, (s, { logs }) => ({ ...s, logs, loading: false })),
    on(ExploreActions.searchFailed, (s, { error }) => ({ ...s, error, loading: false })),
  ),
});

export const search$ = createEffect(
  (actions$ = inject(Actions), api = inject(LogsApi)) =>
    actions$.pipe(
      ofType(ExploreActions.queryChanged),
      debounceTime(200),
      switchMap(({ query }) =>
        api.search({ query }).pipe(
          map(logs => ExploreActions.searchSucceeded({ logs })),
          catchError(e => of(ExploreActions.searchFailed({ error: e.message }))),
        ),
      ),
    ),
  { functional: true },
);
```

- Selectors (`createSelector`) are memoized; `store.selectSignal(selector)` gives a signal.
- `@ngrx/entity` for normalized collections (ids + entities, adapter CRUD).
- `@ngrx/router-store` syncs router state into the store.
- Pros: predictable, devtools/time travel, event log helps debugging, clear patterns for big teams.
- Cons: boilerplate, indirection, everything global unless you're careful, learning curve.

## 4. Option C — NgRx SignalStore (modern middle ground)

```ts
export const ExploreStore = signalStore(
  withState<ExploreState>({ query: '', logs: [], loading: false, error: null }),
  withComputed(({ logs }) => ({
    errorCount: computed(() => logs().filter(l => l.severity === 'error').length),
  })),
  withMethods((store, api = inject(LogsApi)) => ({
    setQuery(query: string) {
      patchState(store, { query });
    },
    search: rxMethod<string>(
      pipe(
        debounceTime(200),
        tap(() => patchState(store, { loading: true })),
        switchMap(q =>
          api.search({ query: q }).pipe(
            tapResponse({
              next: logs => patchState(store, { logs, loading: false }),
              error: (e: Error) => patchState(store, { error: e.message, loading: false }),
            }),
          ),
        ),
      ),
    ),
  })),
  withHooks({ onInit: store => store.search(store.query) }),
);
```

Composable features (`withEntities`, custom `withRequestStatus()`), can be root or component-scoped, signals-native, much less boilerplate than Redux.

## 5. How to choose (answer template)

> "I start with the simplest thing: URL for shareable state, component signals for local UI, and a feature-scoped signal store for server data with cancellation. I move to NgRx Store when many features need to react to the same events, when we need devtools/event logs to debug complex flows, or when the team is large and benefits from enforced conventions. SignalStore is a good default when we want structure without Redux ceremony. Whatever we pick, consistency across the monorepo matters more than the library — I'd document it and enforce with lint rules."

## 6. Server cache concerns (often missed — mention them)

- **Cancellation** of stale requests (`switchMap`).
- **Deduplication** of identical in-flight requests (`shareReplay` keyed cache).
- **Stale-while-revalidate** (show cached, refresh in background) — e.g. service list in APM.
- **Invalidation** after mutations (saved view created → refetch list or optimistic update).
- **Pagination / cursors** merged into one list; reset on filter change.
- **Polling** vs push (WebSocket/SSE) for live data.
- **Error and empty states** as first-class UI.

## 7. URL as state — example

```ts
export class ExplorePage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly params = toSignal(this.route.queryParamMap, { requireSync: true });
  readonly filters = computed(() => parseFilters(this.params()));   // validate & default here

  update(patch: Partial<ExploreFilters>) {
    this.router.navigate([], {
      queryParams: serializeFilters({ ...this.filters(), ...patch }),
      replaceUrl: true,                 // typing in search shouldn't spam history
    });
  }
}
```

Points: validate/parse on read (URLs are user input), use `replaceUrl` for high-frequency changes and `push` for meaningful navigations (open a trace), keep relative time ranges relative in the URL (`from=now-15m`) so shared links stay useful, but resolve to absolute when the user "freezes" a view for an incident.

---

## Must-explain questions

1. How do you categorize state, and where does each category live?
2. When is NgRx worth it? When is it overkill?
3. How do you avoid duplicated/inconsistent state between URL, store and components?
4. How do you model loading/error/success? (Discriminated union.)
5. How would you scope state so each dashboard widget has its own store? (Component-level `providers`.)
6. Optimistic updates — when and how do you roll back?
