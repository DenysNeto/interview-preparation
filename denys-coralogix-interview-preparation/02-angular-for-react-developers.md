# Modern Angular for a React Developer

Targets modern Angular (v17+; signals, standalone, built-in control flow; zoneless is the default for new apps in the latest versions). Interviewers at a company with a large, long-lived Angular app will also ask about **NgModules, Zone.js, and RxJS-heavy code** — know both worlds.

Answer style: say the Angular concept, then the React analogy, then the trade-off.

---

## 0. React → Angular map

| React | Angular |
| --- | --- |
| Function component | `@Component` class with a template (standalone by default) |
| Props | `input()` / `input.required()` (old: `@Input()`) |
| Callback props | `output()` (old: `@Output() x = new EventEmitter()`) |
| Two-way (`value` + `onChange`) | `model()` + `[(value)]` "banana in a box" |
| `useState` | `signal()` |
| `useMemo` | `computed()` (auto-tracked deps, memoized, lazy) |
| `useEffect` | `effect()` for side effects, lifecycle hooks, `afterNextRender()` for DOM work |
| `useRef` (DOM) | `viewChild()` / template ref `#el` |
| Context | Dependency Injection (services, `InjectionToken`) |
| Custom hooks | Services or functions using `inject()` |
| `children` | Content projection `<ng-content>` |
| Render props | `ng-template` + `ngTemplateOutlet` |
| `React.memo` | `ChangeDetectionStrategy.OnPush` (+ signals) |
| `key` in lists | `track` in `@for` |
| React Router | `@angular/router` |
| React Hook Form | Reactive Forms (typed); Signal Forms (experimental, newest) |
| fetch / TanStack Query | `HttpClient` (Observables), `httpResource`/`resource` (newer), NgRx / TanStack Query Angular |
| Redux | NgRx Store; NgRx SignalStore |
| Jest + RTL | Jest/Vitest + TestBed, Angular Testing Library, CDK Harnesses |
| Next.js SSR | Angular SSR + hydration (`@angular/ssr`) |

## 1. Standalone components

```ts
import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { DatePipe } from '@angular/common';

export interface LogEntry {
  id: string;
  timestamp: number;
  severity: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  service: string;
  message: string;
}

@Component({
  selector: 'cx-log-row',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row" [class.row--error]="isError()" (click)="selected.emit(log().id)">
      <time>{{ log().timestamp | date: 'HH:mm:ss.SSS' }}</time>
      <span class="sev">{{ log().severity }}</span>
      <span>{{ log().service }}</span>
      <span class="msg">{{ log().message }}</span>
    </div>
  `,
  styleUrl: './log-row.component.scss',
})
export class LogRowComponent {
  log = input.required<LogEntry>();
  selected = output<string>();
  isError = computed(() => ['error', 'critical'].includes(this.log().severity));
}
```

- `standalone: true` is the default since v19; `imports` lists what the template uses.
- **NgModules** still exist in older code: `declarations`, `imports`, `exports`, `providers`. Know how to explain migrating: `ng generate @angular/core:standalone`.
- Styles are **encapsulated** by default (`ViewEncapsulation.Emulated` — attribute selectors). `:host`, `:host-context()`, `::ng-deep` (deprecated, avoid).

## 2. Templates and built-in control flow

```html
@if (state().status === 'loading') {
  <cx-spinner />
} @else if (state().status === 'error') {
  <cx-error [message]="state().error" />
} @else {
  @for (log of logs(); track log.id; let i = $index) {
    <cx-log-row [log]="log" (selected)="open($event)" />
  } @empty {
    <p>No logs in this time range</p>
  }
}

@defer (on viewport; prefetch on idle) {
  <cx-heavy-chart [series]="series()" />
} @placeholder {
  <div class="chart-skeleton"></div>
}

@let total = logs().length;
```

- Bindings: `[prop]="expr"` property, `(event)="handler($event)"`, `[(ngModel)]` / `[(value)]` two-way, `[attr.aria-label]`, `[class.x]`, `[style.width.px]`.
- `track` is **required** in `@for` (React-like keys). Tracking by identity on immutable re-fetched data destroys and recreates DOM → always track by a stable id.
- Old syntax: `*ngIf`, `*ngFor` + `trackBy`, `[ngSwitch]`. Recognize them.
- `@defer` = lazy-loaded chunk of template (like `React.lazy` + `Suspense`, but declarative triggers: `on viewport`, `on idle`, `on interaction`, `on hover`, `on timer(2s)`, `when cond`).
- **Pipes**: `{{ value | date }}`. Pure pipes (default) re-run only when input reference changes — memoized transform. Impure pipes run every change detection (avoid for heavy work).

## 3. Signals

```ts
const count = signal(0);
count.set(1);
count.update(c => c + 1);

const double = computed(() => count() * 2);   // lazy, memoized, auto-tracked

effect(() => {
  console.log('count changed', count());       // runs when deps change
});

// Derived but writable state that resets when source changes
const selectedId = linkedSignal(() => logs()[0]?.id ?? null);
```

Key points to say:

- Signals are **synchronous, glitch-free, fine-grained** reactive values. Reading a signal in a template or `computed` registers a dependency.
- Equality: `signal(value, { equal })`; default is `Object.is` → **immutable updates** (`update(list => [...list, x])`). Mutating an array in place does not notify.
- `effect` is for syncing to the outside world (localStorage, logging, imperative APIs). **Don't use effects to set other signals** — use `computed` / `linkedSignal`. Same advice as "you might not need an effect" in React.
- `untracked(() => …)` reads without creating a dependency.
- Signal inputs (`input()`) are signals → derive with `computed` instead of `ngOnChanges`.
- `resource()` / `rxResource()` / `httpResource()` — async data as signals (`value()`, `isLoading()`, `error()`, `reload()`), re-fetch when request signal changes, cancels previous. Newer API; mention as "where Angular is going".
- **Signals vs RxJS:** signals = state (current value, sync). RxJS = events over time (debounce, cancellation, websockets, combining async streams). Interop: `toSignal(obs$)`, `toObservable(sig)`.

## 4. Dependency Injection (the biggest conceptual difference from React)

```ts
@Injectable({ providedIn: 'root' })            // app-wide singleton, tree-shakable
export class LogsApi {
  private http = inject(HttpClient);
  search(q: LogQuery) {
    return this.http.post<LogSearchResponse>('/api/logs/search', q);
  }
}

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: API_BASE_URL, useValue: '/api' },
  ],
});
```

**Hierarchy** (must explain):

1. **Element injectors** — `providers` on a component/directive. Each component instance gets its own instance; children can inject it. Used for component-scoped state (e.g. a store per widget on a dashboard).
2. **Environment injectors** — root (`providedIn: 'root'`, `bootstrapApplication` providers), and **lazy route** injectors (`providers` on a route).
3. Platform injector → Null injector (throws `NullInjectorError`).

Resolution walks up element injectors first, then environment injectors. Modifiers: `inject(X, { optional: true, self: true, skipSelf: true, host: true })`.

Provider recipes: `useClass`, `useValue`, `useFactory` (with `deps` or `inject()` inside), `useExisting` (alias), `multi: true` (plugin lists, e.g. `HTTP_INTERCEPTORS`, validators).

**Why DI matters for a senior answer:** testability (swap implementations in TestBed), scoping state to a feature or component subtree, configuration per environment, avoiding prop drilling without global singletons.

`inject()` only works in an **injection context** (constructor, field initializers, factory, `runInInjectionContext`).

## 5. Inputs, outputs, model, queries

```ts
value = model<string>('');                         // parent: [(value)]="query"
columns = input<string[]>([], { alias: 'cols' });
pageSize = input(50, { transform: numberAttribute });
rowClick = output<LogEntry>();

table = viewChild.required<ElementRef<HTMLDivElement>>('table');
tabs = contentChildren(TabComponent);              // projected children
```

- `viewChild` = elements in **own template**; `contentChild` = elements **projected** in from the parent.
- Prefer signal queries over `@ViewChild` + `ngAfterViewInit`.

## 6. Change detection (expect a deep question)

**Classic model (Zone.js):**

- Zone.js monkey-patches async APIs (events, timers, XHR, promises). After any async task, Angular runs change detection **top-down over the whole component tree**, comparing template bindings to previous values, updating the DOM where different.
- In dev mode it runs a second pass to verify nothing changed → `ExpressionChangedAfterItHasBeenCheckedError` (you changed state during CD, e.g. in `ngAfterViewInit`).

**OnPush:** component (and its subtree) is checked only when:

1. An `input` reference changes (not a deep mutation).
2. An event handler in the component/its template fires.
3. An `async` pipe emits / `markForCheck()` is called.
4. A **signal read in its template** changes.

→ Requires immutable data. Biggest perf lever in Zone apps. `ChangeDetectorRef`: `markForCheck()` (mark path to root dirty), `detectChanges()` (check now, locally), `detach()`/`reattach()` (manual control for very hot components).

**Zoneless (`provideZonelessChangeDetection()`, default in latest new apps):**

- No Zone.js. Angular schedules CD only when notified: signal change read in a template, `markForCheck` (async pipe does it), template event handlers, input changes.
- Benefits: smaller bundle, no monkey-patching, fewer pointless CD cycles, better stack traces, works better with native async/await.
- Migration risk: code mutating plain fields inside `setTimeout`/promise callbacks won't update the view → move state into signals or call `markForCheck`.

**Signals + OnPush** enable "local" change detection: only components whose signals changed get refreshed (views are marked for refresh without dirtying ancestors).

**Running outside Angular** (Zone apps): `NgZone.runOutsideAngular(() => …)` for `mousemove`, `scroll`, `requestAnimationFrame`, websockets at high frequency; re-enter with `ngZone.run()` only when the UI needs to update. Classic interview question for data-heavy apps.

**React comparison:** React re-renders a component subtree when state changes and reconciles a virtual DOM. Angular compiles templates to instructions that update bindings directly (no vDOM); the question is *which components get checked*.

## 7. Lifecycle

Order: `constructor` → `ngOnChanges` (inputs set) → `ngOnInit` → `ngDoCheck` → `ngAfterContentInit` → `ngAfterContentChecked` → `ngAfterViewInit` → `ngAfterViewChecked` → … → `ngOnDestroy`.

Modern equivalents:

- `DestroyRef.onDestroy(cb)` and `takeUntilDestroyed()` instead of `ngOnDestroy` + `Subject`.
- `afterNextRender(() => …)` for one-time DOM work after render (measure size, init a chart lib). `afterEveryRender` for every render (use sparingly).
- `computed` instead of `ngOnChanges` for derived state.

## 8. Router

```ts
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'explore' },
  {
    path: 'explore',
    loadComponent: () => import('./explore/explore.page').then(m => m.ExplorePage),
    canActivate: [authGuard],
    resolve: { savedViews: savedViewsResolver },
  },
  {
    path: 'apm',
    loadChildren: () => import('./apm/apm.routes').then(m => m.APM_ROUTES),
    providers: [ApmStore],                         // feature-scoped injector
  },
  { path: '**', component: NotFoundPage },
];

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() || inject(Router).createUrlTree(['/login']);
};
```

- `withComponentInputBinding()` → route params / query params / resolver data bound to component `input()`s.
- Query params as state: `router.navigate([], { queryParams: { q, from, to }, queryParamsHandling: 'merge', replaceUrl: true })`.
- Guards: `canActivate`, `canActivateChild`, `canDeactivate` (unsaved changes), `canMatch` (feature flags / roles choosing routes).
- Preloading: `withPreloading(PreloadAllModules)` or custom strategy.

## 9. Forms

**Reactive forms (typed):**

```ts
private fb = inject(NonNullableFormBuilder);
form = this.fb.group({
  query: [''],
  severity: [[] as Severity[]],
  threshold: [100, [Validators.required, Validators.min(1)]],
});

ngOnInit() {
  this.form.valueChanges
    .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
    .subscribe(v => this.store.setFilters(v));
}
```

- `FormControl`, `FormGroup`, `FormArray`, `FormRecord`; sync and async validators; `updateOn: 'blur'`.
- Template-driven forms (`ngModel`) — simpler, less testable, fine for tiny forms.
- **`ControlValueAccessor`** — how to make a custom component (e.g. time range picker, query editor) work with `formControlName`. Implement `writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`; provide `NG_VALUE_ACCESSOR`. Frequently asked for senior Angular.
- Signal Forms — experimental in the newest version; mention awareness only.

## 10. HTTP and interceptors

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) inject(Router).navigate(['/login']);
      return throwError(() => err);
    }),
  );
};
```

- `HttpClient` returns **cold** Observables: nothing happens until subscribe; each subscribe = new request; unsubscribing **cancels** the request.
- Interceptor uses: auth, retries, correlation ids (`traceparent`), error toasts, caching, timing metrics.
- `HttpContext` tokens to pass per-request flags to interceptors (e.g. `SKIP_ERROR_TOAST`).
- Testing: `provideHttpClientTesting()` + `HttpTestingController`.

## 11. Content projection and templates

```html
<!-- card.component.html -->
<header><ng-content select="[card-title]" /></header>
<section><ng-content /></section>

<!-- table that lets the consumer render a cell -->
<ng-container *ngTemplateOutlet="cellTpl(); context: { $implicit: row, column: col }" />
```

- `ng-template` = a template not rendered until instantiated (like a render function).
- `ng-container` = grouping element with no DOM node (like `<>` Fragment).
- Structural directives: custom `*cxIfFeature="'new-explore'"` with `TemplateRef` + `ViewContainerRef`.
- **Directives** add behavior to elements: attribute directives (`cxTooltip`, `cxResizeColumn`), host directives (`hostDirectives` composition). React has no direct equivalent (closest: hooks + ref callbacks).

## 12. Other things worth knowing

- **Angular CDK**: virtual scroll, overlay (popovers, dropdowns), a11y (`FocusTrap`, `LiveAnnouncer`, `FocusKeyManager`), drag-drop, table, layout `BreakpointObserver`. Angular Material on top.
- **SSR/hydration**: less relevant for an authenticated SaaS app; know why (SEO irrelevant, TTI dominated by data fetch; SSR adds infra complexity).
- **i18n**: `@angular/localize` (compile-time) vs runtime libs (Transloco, ngx-translate).
- **Build**: Angular CLI uses esbuild + Vite dev server (application builder). Budgets in `angular.json`.
- **Security**: Angular sanitizes values bound to `[innerHTML]`, `[src]`, `[style]` automatically. `DomSanitizer.bypassSecurityTrust*` is a red flag in review. Interpolation `{{ }}` is always escaped.
- **Error handling**: global `ErrorHandler` provider → send to monitoring (in Coralogix's case — to their own RUM!).

---

## Must-explain questions

**How does change detection work, and how would you make a page with 5,000 rows fast?**
Zone triggers a top-down check after async events; OnPush limits checks to components whose inputs/events/signals changed; signals make it fine-grained; zoneless removes the global trigger. For 5,000 rows: virtual scroll (render ~50), OnPush rows with immutable inputs, `track` by id, pure pipes instead of template method calls, run high-frequency listeners outside Angular, move heavy computation to a worker.

**Why is calling a method in the template bad (`{{ format(row) }}`)?**
It runs on every change detection pass for every row. Use a pure pipe, `computed`, or precompute in the view model.

**Signals vs RxJS — when do you use which?**
Signals for state the template reads (sync, current value). RxJS for event streams and async orchestration (debounce, cancel, retry, websocket, combining sources). Convert at the boundary with `toSignal`/`toObservable`.

**What is `providedIn: 'root'` vs component `providers`?**
Root = one instance for the app, tree-shakable. Component providers = new instance per component instance, visible to its subtree; destroyed with the component. Route providers = per lazy feature.

**What's `ExpressionChangedAfterItHasBeenCheckedError`?**
Dev-only check: a binding changed between the CD pass and the verification pass — usually state set in `ngAfterViewInit` or by a child modifying a parent during CD. Fix the data flow (compute earlier, use signals/computed), don't wrap in `setTimeout`.

**How do you avoid memory leaks with subscriptions?**
`async` pipe or `toSignal` (auto-unsubscribe), `takeUntilDestroyed()`, avoid nested subscribes, finite operators (`take(1)`, `first()`) for one-shot. HttpClient completes on its own, but long-lived streams (store selects, websockets, `interval`, `fromEvent`, router events) do not.

**How would you migrate a large NgModule + Zone app to standalone + signals + zoneless?**
Incrementally: schematics for standalone and control flow; enable OnPush per feature; introduce signals for new state and `toSignal` at boundaries; fix code relying on Zone (mutations in callbacks); measure; flip to zoneless when the app runs clean with OnPush everywhere. Mention feature flags and telemetry to verify no regressions.

**What is `ControlValueAccessor`?**
The bridge between Angular Forms and a custom input component; lets `formControlName` drive a time range picker or a query editor like a native input.

**Smart vs dumb (container vs presentational) components?**
Containers inject stores/services and handle data; presentational components only take inputs and emit outputs, are OnPush and easy to test/reuse. Same idea as in React.
