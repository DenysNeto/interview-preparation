# Tricky Angular Interview Answers

Spoken answers for the [checklist](tricky-angular-interview-topics.md). Each section is what you say first, followed by an example and the trap interviewers look for. The basics are in [angular.md](angular.md).

---

## Change detection with Zone.js

Zone.js patches every async API in the browser: DOM events, `setTimeout`, `Promise`, XHR/fetch. When an async task finishes, Zone tells Angular "something might have changed", and Angular runs `ApplicationRef.tick()`. That walks the component tree from the root, evaluates every template binding, compares it with the previous value, and writes only the differences to the DOM.

Things to say out loud:

- Angular doesn't know *what* changed, only that *something async* happened. So with the default strategy it checks everything.
- Checking is cheap per binding, but a large tree checked on every `mousemove` isn't.
- There's no virtual DOM. The compiled template updates DOM nodes directly when a binding value changes.
- In dev mode a second verification pass runs, which is the source of `ExpressionChangedAfterItHasBeenCheckedError`.

---

## OnPush and the mutation trap

With `ChangeDetectionStrategy.OnPush`, Angular skips a component and its subtree unless:

1. An input changed **by reference**.
2. A DOM event bound in its template (or a child's) fired.
3. `markForCheck()` was called. The `async` pipe does this on every emission.
4. A signal read in its template changed.

```ts
// parent
addTag(tag: string) {
  this.filters.tags.push(tag);                                  // same object → OnPush child doesn't update
  this.filters = { ...this.filters, tags: [...this.filters.tags, tag] }; // new reference → updates
}
```

The trap: "it worked before OnPush". With the default strategy the mutation was picked up by the global check. OnPush requires immutable updates, and signals make that natural because `signal.update()` with a new reference is the only way to notify.

---

## markForCheck vs detectChanges vs detach

- `markForCheck()` marks this component **and its ancestors** as dirty. Nothing happens immediately; they get checked in the next change detection run. Use it when something outside Angular's knowledge changed data in an OnPush component, like a manual subscription.
- `detectChanges()` **synchronously** runs change detection for this component and its children, right now. Use it after `detach()`, or when you need the DOM updated before the next line (rare).
- `detach()` removes the component from automatic checks completely. Combine it with `detectChanges()` on your own schedule, for example once per animation frame for a very hot live-updating component.

Trap: calling `detectChanges()` everywhere "to fix" stale views hides a data-flow problem and can trigger `ExpressionChanged` errors.

---

## ExpressionChangedAfterItHasBeenCheckedError

A dev-mode check. After a change detection pass, Angular runs a second verification pass. If any binding now has a different value, the data changed **during** the check, so the view would show stale data.

Common causes:

- Setting state in `ngAfterViewInit` / `ngAfterViewChecked` that the template already rendered.
- A child changing a parent's value during the check (a shared service updated from a child's lifecycle hook).
- A getter that returns a new value every time (`get now() { return Date.now(); }`, or a new array or object).

Fixes: compute the value earlier (constructor, `ngOnInit`, `computed`), move the logic to an event, or restructure the data flow. Wrapping it in `setTimeout` or calling `detectChanges` silences the error but leaves the flow wrong. Say that explicitly.

---

## Zoneless change detection and migration traps

`provideZonelessChangeDetection()` removes Zone.js. Angular schedules change detection only when notified: a signal read in a template changes, `markForCheck()` is called (`async` pipe included), a bound template event fires, or an input changes via `setInput`.

Benefits: smaller bundle (no Zone.js), no monkey-patching, no wasted checks from unrelated timers or third-party libraries, readable stack traces, native `async/await` works without transpiling.

What breaks when migrating:

```ts
ngOnInit() {
  setTimeout(() => (this.loading = false), 500);   // plain field + timer → view never updates zoneless
}
loading = signal(true);
ngOnInit() {
  setTimeout(() => this.loading.set(false), 500);  // works
}
```

- Plain fields mutated in timers, promises, or manual subscriptions.
- Code relying on `NgZone.onStable` / `onMicrotaskEmpty`.
- Tests using `fakeAsync` that assumed Zone.

Path: OnPush everywhere first (OnPush components already behave almost zoneless-ready), move state to signals or the `async` pipe, then switch.

---

## Running code outside Angular with NgZone

In Zone apps, every event listener triggers a full change detection. For high-frequency events (`mousemove`, `scroll`, `resize`, `requestAnimationFrame`, websockets, chart libraries) that's wasted work.

```ts
private zone = inject(NgZone);

constructor() {
  afterNextRender(() => {
    this.zone.runOutsideAngular(() => {
      this.chart = new HeavyChart(this.canvas().nativeElement);   // its listeners don't trigger CD
      fromEvent<MouseEvent>(window, 'mousemove').pipe(throttleTime(16)).subscribe(e => this.drawCrosshair(e));
    });
  });
}

onPointSelected(p: Point) {
  this.zone.run(() => this.selected.set(p));   // re-enter only when the UI must update
}
```

The term is "zone pollution": third-party libraries triggering change detection far too often. Angular DevTools shows it as many tiny change-detection cycles. In zoneless apps this mostly disappears.

---

## Zone.js and native async/await

Zone.js can't patch native `async/await`: the engine handles it internally, without going through `Promise.prototype.then`. That's why Angular CLI projects using Zone.js **downlevel async/await to generators** when building. If someone asks why the build output contains generator code in a modern browser target, this is the reason. Zoneless apps don't need the downleveling.

---

## Signal equality and immutable updates

A signal notifies only when the new value is **not equal** to the old one. Default equality is `Object.is`.

```ts
const items = signal<string[]>([]);
items().push('a');                     // mutation: no notification, computed values are stale
items.update(list => [...list, 'a']);  // new array: notifies

const user = signal(initial, { equal: (a, b) => a.id === b.id && a.version === b.version });
```

`computed` uses equality too: if a computed value recomputes to an equal value, its dependents are **not** notified. That's a cheap way to cut off update propagation, for example `computed(() => logs().length > 0)`.

---

## computed laziness and dynamic dependencies

- `computed` is **lazy**: it doesn't run until someone reads it, and it's **memoized** until a dependency changes.
- Dependencies are **dynamic**: only the signals read during the *last* execution are tracked.

```ts
const showDetails = signal(false);
const details = signal({ cpu: 1 });
const label = computed(() => (showDetails() ? `CPU ${details().cpu}` : 'hidden'));
```

While `showDetails` is false, `details` isn't a dependency, so changing it doesn't recompute `label`. That's correct and efficient. It also means you can't "pre-subscribe" by reading conditionally.

Trap: side effects inside `computed` (HTTP calls, writing other signals). It must be a pure derivation; use `effect` or event handlers for side effects.

---

## effect timing, cleanup, and when not to use it

- Effects run **asynchronously**, as part of change detection, not synchronously on `set()`. Several sets in a row produce one effect run.
- An effect created in a component is destroyed with the component; outside an injection context you must pass an `injector`.
- Cleanup: `effect((onCleanup) => { const id = setInterval(tick, 1000); onCleanup(() => clearInterval(id)); })`.

Good uses: syncing to localStorage, logging or analytics, imperative third-party APIs (a chart library, a map), `document.title`.

Bad use, and the classic interview point:

```ts
effect(() => this.fullName.set(`${this.first()} ${this.last()}`));  // ✗ effect to derive state
fullName = computed(() => `${this.first()} ${this.last()}`);       // ✓
```

Setting signals from effects causes extra change detection cycles and possible loops. It's the Angular version of React's "you might not need an effect".

---

## untracked reads

`untracked(() => signal())` reads a value without creating a dependency. Use it inside an effect or computed when one signal should *trigger* and another should only be *read*:

```ts
effect(() => {
  const query = this.query();                         // dependency: re-run when the query changes
  untracked(() => this.analytics.log(query, this.user().id)); // reads user without re-running when user changes
});
```

It also helps when calling a service method that reads signals internally. Without `untracked`, those reads quietly become dependencies of your effect.

---

## linkedSignal vs computed vs effect

| Need | Use |
| --- | --- |
| Value fully derived from other signals, read-only | `computed` |
| Derived **default** that the user can override, which resets when the source changes | `linkedSignal` |
| Side effect outside the signal graph | `effect` |

```ts
options = input.required<Service[]>();
selected = linkedSignal(() => this.options()[0] ?? null);   // resets when options change
pick(s: Service) { this.selected.set(s); }                   // user can still override it
```

Before `linkedSignal`, people used an effect to "reset selection when the list changes", which is exactly the anti-pattern above.

---

## Signal inputs vs `@Input` and `ngOnChanges`

```ts
// old
@Input() set range(v: TimeRange) { this._range = v; this.recalculate(); }
ngOnChanges(changes: SimpleChanges) { if (changes['data']) { this.recalculate(); } }

// new
range = input.required<TimeRange>();
data = input<Point[]>([]);
buckets = computed(() => bucketize(this.data(), this.range()));
```

- Signal inputs are read-only signals, so derived state is a `computed` and no `ngOnChanges` bookkeeping is needed.
- Required inputs are checked at compile time.
- `transform` converts attribute strings: `disabled = input(false, { transform: booleanAttribute })`.
- Reading a required input in the constructor throws, because it isn't set yet. Read it in `computed`, effects, or the template.

---

## model and two-way binding

`model()` creates a writable signal input plus an implicit `<name>Change` output. The parent uses banana-in-a-box syntax:

```ts
// child
expanded = model(false);
toggle() { this.expanded.update(v => !v); }   // also emits expandedChange

// parent
<app-panel [(expanded)]="isOpen" />           // isOpen can be a signal or a plain field
```

Use it for genuinely two-way UI state (open/closed, a selected tab, a value in a custom control). Overusing two-way binding makes data flow hard to follow, the same argument as controlled vs uncontrolled components in React.

---

## Async data with resource and httpResource

`resource` turns async loading into signals: when its params signal changes, it calls the loader, cancels the previous request, and exposes `value()`, `isLoading()`, `error()`, `status()`, `reload()`.

```ts
userId = input.required<string>();
user = httpResource<User>(() => `/api/users/${this.userId()}`);
// template: @if (user.isLoading()) {…} @else if (user.error()) {…} @else { {{ user.value()?.name }} }
```

Say that the API is new and option names changed between versions (`request` became `params`). The concept to explain is signal-driven fetching with built-in race protection. For complex streams (debounce, retry, websockets) RxJS is still the better tool, and `rxResource` bridges the two.

---

## toSignal and toObservable pitfalls

`toSignal(obs$)`:

- Subscribes **immediately** on creation, so a cold HTTP Observable fires the request right away.
- Must be called in an injection context (field initializer or constructor) or given `{ injector }`. It unsubscribes when that context is destroyed.
- Without `initialValue` the type includes `undefined`. `requireSync: true` asserts a synchronous first emission (a `BehaviorSubject`, a store select).
- If the Observable errors, reading the signal throws. Handle errors in the stream.

`toObservable(sig)`:

- Emits through an effect, so emissions are **asynchronous** and **coalesced**: `set(1); set(2); set(3)` in one tick emits only `3`.
- The first value is also emitted asynchronously, not on subscribe.

---

## Injector hierarchy: element vs environment injectors

Two trees:

- **Element injector tree**, following the DOM/component tree. Created by `providers` on components and directives.
- **Environment injector tree**: root → lazy route injectors. Created by `bootstrapApplication` providers, `providedIn: 'root'`, and route `providers`.

Lookup for `inject(X)` from a component: its own element injector → parent component's → … → host root, then the environment injector of that view (route → root) → platform → null injector (throws `NullInjectorError`).

Why it matters:

```ts
@Component({ selector: 'app-widget', providers: [WidgetStore] })   // one store per widget instance
export class WidgetComponent { store = inject(WidgetStore); }
```

Ten widgets on a dashboard get ten independent stores, each destroyed with its widget, and children of a widget get that widget's store. This is how you scope state to a subtree without global singletons.

---

## Accidental multiple service instances

A classic bug: "my service is a singleton, but two components see different data."

Causes:

1. The service is listed in a **component's** `providers` as well as `providedIn: 'root'`. The component gets its own copy.
2. It's listed in the `providers` of a **lazy-loaded route or module**, which creates a child environment injector and a separate instance for that feature.
3. Old NgModule code: importing a module with `providers` into several lazy modules. The `forRoot()` pattern exists to prevent this.

Fix: `@Injectable({ providedIn: 'root' })` and nothing else for real singletons. Provide at component or route level only when you deliberately want scoped instances.

---

## Resolution modifiers: self, skipSelf, host, optional

```ts
inject(Logger, { optional: true });   // null instead of throwing when there's no provider
inject(FormGroupDirective, { self: true });     // only this element's injector
inject(TreeNodeComponent, { skipSelf: true });   // start from the parent (find the parent node in a recursive tree)
inject(ThemeDirective, { host: true });          // stop searching at the host component boundary
```

Real uses: a recursive tree component finding its parent with `skipSelf`; a form control directive that must be on the same element (`self`); optional plugins (`optional`). The decorator equivalents are `@Optional()`, `@Self()`, `@SkipSelf()`, `@Host()`.

---

## inject and the injection context

`inject()` works only in an injection context:

- Field initializers and constructors of classes created by DI (components, directives, pipes, services).
- `useFactory` functions, functional guards, resolvers, and interceptors.
- Inside `runInInjectionContext(injector, fn)`.

```ts
ngOnInit() {
  const http = inject(HttpClient);   // ✗ NG0203: inject() must be called from an injection context
}
private http = inject(HttpClient);   // ✓
```

The same applies to everything built on top of it: `toSignal`, `takeUntilDestroyed()` without an argument, `effect`, `afterNextRender`. Outside a context, pass `{ injector }` or a `DestroyRef`.

Why `inject()` over constructor injection: works in functions (guards, interceptors, reusable `injectX()` helpers that act like custom hooks), plays well with inheritance, and has better type inference.

---

## InjectionToken, useExisting, and multi providers

```ts
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
{ provide: APP_CONFIG, useValue: { apiUrl: '/api' } }

{ provide: Logger, useClass: ConsoleLogger }      // new instance of a different class
{ provide: AuditLogger, useExisting: Logger }     // alias: same instance as Logger
{ provide: Logger, useFactory: () => (inject(ENV).prod ? new RemoteLogger() : new ConsoleLogger()) }

export const VALIDATION_RULES = new InjectionToken<Rule[]>('VALIDATION_RULES');
{ provide: VALIDATION_RULES, useValue: requiredRule, multi: true }
{ provide: VALIDATION_RULES, useValue: emailRule, multi: true }   // inject(VALIDATION_RULES) → [requiredRule, emailRule]
```

Trap: `useClass` when you meant `useExisting` creates a **second** instance with its own state. Tokens are needed for non-class values (config, functions, interfaces), because TypeScript interfaces don't exist at runtime.

---

## providers vs viewProviders

Both create element-injector providers on a component. The difference is **projected content**:

- `providers`: visible to the component's template **and** to content projected into it via `<ng-content>`.
- `viewProviders`: visible only to the component's own template, not to projected content.

Use `viewProviders` when a component's internal service shouldn't leak to content that consumers project into it, which is a library-author concern.

---

## Constructor vs ngOnInit

- The constructor runs when DI creates the instance. Inputs are **not** set yet. Use it (or field initializers) for `inject()`, creating signals and computed values, and registering effects.
- `ngOnInit` runs once after the first `ngOnChanges`, when decorator inputs are available. Use it for initialization that needs input values in decorator-based code.

With signal inputs, most of the "wait for inputs" logic becomes `computed` or effects, so `ngOnInit` matters less. Don't put heavy work or HTTP calls in the constructor of a component that's often created and thrown away in tests.

---

## Lifecycle order with parents and children

For a parent `P` with child `C` on the first check:

1. `P`: ngOnChanges → ngOnInit → ngDoCheck → ngAfterContentInit → ngAfterContentChecked
2. `C`: ngOnChanges → ngOnInit → ngDoCheck → ngAfterContentInit → ngAfterContentChecked → ngAfterViewInit → ngAfterViewChecked
3. `P`: ngAfterViewInit → ngAfterViewChecked

So a parent's view is "initialized" only after all its children's views are. That's why `@ViewChild` values are ready in the parent's `ngAfterViewInit`, and why changing parent state there that the parent's template already used triggers `ExpressionChanged`.

`ngDoCheck` and the `*Checked` hooks run on **every** change detection pass. Heavy code there is a performance smell.

---

## viewChild timing and static queries

```ts
@ViewChild('input', { static: true }) input!: ElementRef;  // resolved before ngOnInit; only if NOT inside @if/*ngIf
@ViewChild('chart') chart!: ElementRef;                      // static: false → available in ngAfterViewInit
```

- Elements inside conditionals or loops can't be static, because they might not exist.
- Signal queries (`viewChild()`) remove the timing guesswork: they're signals that update when the element appears or disappears. `viewChild.required()` throws if read before it's available, so read it in `afterNextRender`, an effect, or an event handler.
- `{ read: ElementRef }` / `{ read: ViewContainerRef }` choose what you get back from an element that also has a component or directive.

---

## Content projection is always instantiated by the parent

Projected content belongs to the **parent's** view, not the child's.

```html
<!-- child template -->
@if (open()) { <ng-content /> }
```

```html
<!-- parent -->
<app-collapsible><app-heavy-chart /></app-collapsible>
```

`app-heavy-chart` is created, and its `ngOnInit` runs and its HTTP call fires, **even when `open()` is false**. `@if` around `<ng-content>` only hides the DOM. Also:

- Content can be projected into only one `<ng-content>`, so you can't render the same content twice.
- The projected component's lifecycle follows the parent, not the child.

Fix for conditional or repeated rendering: the consumer passes an `ng-template`, and the child renders it with `ngTemplateOutlet` only when needed (or use `@defer`):

```html
<app-collapsible>
  <ng-template appCollapsibleContent><app-heavy-chart /></ng-template>
</app-collapsible>
```

---

## ng-template vs ng-container vs ng-content

| | Renders DOM? | Purpose |
| --- | --- | --- |
| `<ng-template>` | Not until instantiated | A blueprint: used by structural directives, `ngTemplateOutlet`, `else` branches |
| `<ng-container>` | No element of its own | Group nodes or host a structural directive without an extra `<div>` (Fragment) |
| `<ng-content>` | Moves projected nodes here | Slot for content from the parent (`children`) |

Common follow-up: "how do you apply two structural directives to one element?" You can't. Wrap with `<ng-container *ngIf>` around the `*ngFor` element, or use `@if`/`@for` blocks, which nest naturally.

---

## Structural directive microsyntax

The `*` is sugar for an `ng-template`:

```html
<li *ngFor="let item of items; trackBy: trackById; let i = index">{{ i }} {{ item.name }}</li>

<!-- desugars to -->
<ng-template ngFor let-item [ngForOf]="items" [ngForTrackBy]="trackById" let-i="index">
  <li>{{ i }} {{ item.name }}</li>
</ng-template>
```

A custom structural directive:

```ts
@Directive({ selector: '[appHasRole]' })
export class HasRoleDirective {
  private tpl = inject(TemplateRef<unknown>);
  private vcr = inject(ViewContainerRef);
  private auth = inject(AuthService);
  appHasRole = input.required<string>();

  constructor() {
    effect(() => {
      this.vcr.clear();
      if (this.auth.roles().includes(this.appHasRole())) this.vcr.createEmbeddedView(this.tpl);
    });
  }
}
```

---

## Pure vs impure pipes

- **Pure** (default): runs again only when the input reference or an argument changes. Mutating an array that's passed to a pure pipe → the pipe doesn't re-run → stale output.
- **Impure** (`pure: false`): runs on every change detection pass, potentially many times per second. It must be very cheap.

```html
{{ logs | filterBySeverity: 'error' }}    <!-- pure: stale if logs is mutated with push() -->
```

Answer pattern: use pure pipes for formatting (they're memoized per binding), keep data immutable, and for heavy filtering prefer a `computed` in the component, which is also easier to test.

---

## The async pipe and duplicate subscriptions

Every `| async` creates a **separate subscription**. With a cold HTTP Observable, that's a separate request each time:

```html
<h1>{{ (user$ | async)?.name }}</h1>
<img [src]="(user$ | async)?.avatar" />      <!-- 2 HTTP requests -->
```

Fixes:

```html
@if (user$ | async; as user) {
  <h1>{{ user.name }}</h1><img [src]="user.avatar" />
}
```

Or `user = toSignal(this.user$)` in the class, or `shareReplay({ bufferSize: 1, refCount: true })` on the source. The `async` pipe also returns `null` before the first emission, which is why the types often include `null`.

---

## Function calls in templates

```html
<td>{{ formatDuration(span.duration) }}</td>
```

The function runs on **every** change detection pass, for every row. With the default strategy and 1,000 rows that adds up on every click anywhere in the app. Getters have the same problem.

Fixes: a pure pipe (`{{ span.duration | duration }}`), precomputing a view model, or a `computed`. Calling a **signal** in a template (`{{ count() }}`) is fine: it's a cheap memoized read, not arbitrary computation.

---

## track in `@for`

`track` tells Angular how to match items between renders, the same as `key` in React.

```html
@for (log of logs(); track log.id) { … }   <!-- ✓ stable id -->
@for (log of logs(); track log) { … }      <!-- ✗ for re-fetched data: new objects → whole list re-created -->
@for (n of [1, 2, 3]; track $index) { … }  <!-- fine for static lists without state -->
```

Tracking by object identity looks fine until the list is re-fetched: every item is a new object, so Angular destroys and recreates all DOM and component state (focus, scroll, expanded rows). Angular warns about this in dev mode. Tracking by `$index` on a list where items get inserted or removed attaches component state to the wrong rows, the same bug as index keys in React.

---

## `@defer` triggers and pitfalls

```html
@defer (on viewport; prefetch on idle) {
  <app-flame-graph [data]="trace()" />
} @placeholder (minimum 300ms) {
  <div class="skeleton"></div>
} @loading (after 150ms; minimum 500ms) {
  <app-spinner />
} @error {
  <p>Failed to load</p>
}
```

Pitfalls:

- Deferred components, directives, and pipes must be standalone and **not referenced anywhere else in the same file** (including in TypeScript code), or the bundler includes them eagerly and nothing is deferred.
- `on viewport` needs a placeholder (or a reference element) to observe.
- Without `minimum`/`after`, fast loads cause spinner flicker.
- On the server, `@defer` renders the placeholder. With incremental hydration (`hydrate on viewport`) the server renders the real content and hydrates it lazily.

---

## View encapsulation, `:host`, and `::ng-deep`

- `Emulated` (default): Angular rewrites selectors with generated attributes, so styles stay scoped to the component.
- `ShadowDom`: real Shadow DOM.
- `None`: styles are global.

```scss
:host { display: block; }                     // style the component's own element
:host(.compact) .row { height: 24px; }        // when the host has a class
:host-context(.dark-theme) .row { … }         // when an ancestor has a class
::ng-deep .mat-mdc-select-panel { … }         // pierces encapsulation: deprecated, leaks globally
```

Better alternatives to `::ng-deep`: CSS custom properties (`--row-height`) that the child exposes, component inputs, or global theme styles. Also mention that a component's host element is `display: inline` by default, which surprises people with layout bugs.

---

## Flattening operators in Angular code

Where each shows up in a real app:

| Operator | Angular case |
| --- | --- |
| `switchMap` | Route param → load entity; search box → results (cancels stale requests) |
| `mergeMap` | Load details for many independent items in parallel |
| `concatMap` | Save edits in order; queue of mutations |
| `exhaustMap` | Submit or login button; refresh button (ignore clicks while busy) |

```ts
user$ = this.route.paramMap.pipe(
  map(p => p.get('id')!),
  distinctUntilChanged(),
  switchMap(id => this.api.getUser(id)),
);
```

Trap answers: `mergeMap` for search causes race conditions; `switchMap` for saves can cancel a request the server already processed.

---

## Subscription leaks and `takeUntilDestroyed` placement

What leaks: subscriptions to streams that never complete (store selects, `interval`, `fromEvent`, router events, `valueChanges`, Subjects, websockets) when the component is destroyed. `HttpClient` completes after one response, so it's usually safe, but it's still cancelled on destroy only if you unsubscribe.

```ts
this.store.select(selectFilters).pipe(
  takeUntilDestroyed(this.destroyRef),   // ✗ placed before switchMap
  switchMap(f => this.api.poll(f)),      // inner polling stream survives destroy
).subscribe();

this.store.select(selectFilters).pipe(
  switchMap(f => this.api.poll(f)),
  takeUntilDestroyed(this.destroyRef),   // ✓ last operator
).subscribe();
```

Preference order: `async` pipe or `toSignal` (no manual subscription) → `takeUntilDestroyed()` → manual `unsubscribe` in `DestroyRef.onDestroy`.

---

## Nested subscribes

```ts
this.route.paramMap.subscribe(p => {
  this.api.getUser(p.get('id')!).subscribe(user => {
    this.api.getTeam(user.teamId).subscribe(team => (this.team = team));
  });
});
```

Problems: no cancellation (fast navigation shows the wrong user's team), leaks (inner subscriptions are never cleaned up), no single place for error handling, hard to test.

```ts
team = toSignal(
  this.route.paramMap.pipe(
    map(p => p.get('id')!),
    switchMap(id => this.api.getUser(id)),
    switchMap(user => this.api.getTeam(user.teamId)),
    catchError(() => of(null)),
  ),
);
```

---

## HttpClient is cold: duplicate requests and shareReplay

Each subscription to an `HttpClient` Observable sends a **new request**. Components that subscribe several times (several `async` pipes, or a service method called from two places) cause duplicate requests.

```ts
@Injectable({ providedIn: 'root' })
export class ConfigService {
  readonly config$ = inject(HttpClient).get<Config>('/api/config').pipe(
    shareReplay({ bufferSize: 1, refCount: false }),   // cache forever: config never changes
  );
}
```

- `refCount: false`: the result is kept even with no subscribers. Good for one-shot data, but it's a leak for long-lived streams.
- `refCount: true`: unsubscribes from the source when the last subscriber leaves.
- `shareReplay` also caches **errors** until resubscribed. Consider `catchError` before it, or a cache that can be invalidated.

---

## Interceptor order and HttpContext

`provideHttpClient(withInterceptors([auth, retry, logging]))`: requests pass through `auth → retry → logging → backend`; responses come back in **reverse** order (`logging → retry → auth`). So a retry interceptor placed *after* auth retries with the auth header, and placed before auth it would retry the whole chain, including refreshing the token.

`HttpContext` passes per-request metadata to interceptors without polluting headers:

```ts
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

this.http.get('/api/optional', { context: new HttpContext().set(SKIP_ERROR_TOAST, true) });

export const errorToastInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError(err => {
      if (!req.context.get(SKIP_ERROR_TOAST)) inject(Toasts).error(err.message);
      return throwError(() => err);
    }),
  );
```

Also: requests are immutable, so always use `req.clone({...})`.

---

## canMatch vs canActivate and lazy loading

- `canActivate`: the route matched; may it be activated? It runs after matching.
- `canMatch`: may this route **match at all**? If it returns false, the router tries the **next route with the same path**, and the lazy chunk isn't downloaded.

```ts
{ path: 'explore', canMatch: [() => inject(Flags).isOn('new-explore')], loadComponent: () => import('./explore-v2') },
{ path: 'explore', loadComponent: () => import('./explore-v1') },
```

Uses: feature flags, role-based variants of the same URL, and not downloading admin code for regular users. (`canLoad` was the older, deprecated way to prevent loading.)

Remember: guards are UX, not security. The backend must still authorize every request.

---

## Resolvers vs loading in the component

A resolver fetches data **before** navigation completes:

- Pros: the component gets data synchronously, with no loading state inside the component.
- Cons: navigation is blocked, so the user clicks and nothing happens until the data arrives. A slow API makes the app feel frozen. Error handling has to happen in the resolver or with a redirect.

Senior answer: use resolvers for small, critical data (permissions, entity existence → redirect to 404). For heavy data, navigate immediately and load in the component (or a store) with skeletons, which gives better perceived performance. Show a top progress bar using router events if you do use resolvers.

---

## Route reuse and stale snapshot params

Navigating from `/trace/1` to `/trace/2` **reuses** the same component instance: the route config is the same, only the parameter changed. The constructor and `ngOnInit` don't run again.

```ts
ngOnInit() {
  const id = this.route.snapshot.paramMap.get('id');   // ✗ stays "1" after navigating to /trace/2
  this.load(id);
}
```

Fixes:

```ts
id = input.required<string>();                         // with withComponentInputBinding(): updates on every navigation
trace = httpResource<Trace>(() => `/api/traces/${this.id()}`);
// or
trace$ = this.route.paramMap.pipe(switchMap(p => this.api.getTrace(p.get('id')!)));
```

Related: a custom `RouteReuseStrategy` can keep components alive between routes (for example, keeping the search results page when going back), at the cost of memory and stale data.

---

## Typed reactive forms and disabled controls

- Forms are typed: `FormControl<string | null>` by default, because `reset()` sets the value to `null`. Use `nonNullable: true` or `NonNullableFormBuilder` so `reset()` returns to the initial value and the type is `string`.
- **Disabled controls are excluded from `form.value`.** Use `form.getRawValue()` to include them. This is a classic bug when submitting.
- `valueChanges` emits on every change, including programmatic `setValue`. Pass `{ emitEvent: false }` to avoid loops.
- `FormRecord` handles dynamic keys; `FormArray` handles dynamic lists.

```ts
form = new FormGroup({
  name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  id: new FormControl({ value: 'abc', disabled: true }, { nonNullable: true }),
});
form.value;          // { name: '' }            ← no id
form.getRawValue();  // { name: '', id: 'abc' }
```

---

## ControlValueAccessor

The bridge that lets a custom component behave like a native input with `formControlName` or `ngModel`.

```ts
@Component({
  selector: 'app-rating',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RatingComponent), multi: true }],
  template: `@for (s of [1,2,3,4,5]; track s) {
    <button type="button" [disabled]="disabled()" (click)="select(s)" (blur)="onTouched()">{{ s <= value() ? '★' : '☆' }}</button>
  }`,
})
export class RatingComponent implements ControlValueAccessor {
  value = signal(0);
  disabled = signal(false);
  private onChange: (v: number) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(v: number | null) { this.value.set(v ?? 0); }        // model → view; don't call onChange here
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(d: boolean) { this.disabled.set(d); }

  select(v: number) { this.value.set(v); this.onChange(v); }       // view → model
}
```

Traps: calling `onChange` inside `writeValue` marks the form dirty on load; forgetting `setDisabledState` means `control.disable()` does nothing; forgetting `onTouched` breaks "show errors on blur". To add built-in validation, also provide `NG_VALIDATORS`.

---

## Async validators and updateOn

```ts
username = new FormControl('', {
  nonNullable: true,
  validators: [Validators.required],
  asyncValidators: [uniqueUsername(inject(UsersApi))],
  updateOn: 'blur',     // validate and update the value on blur instead of on every keystroke
});

export const uniqueUsername = (api: UsersApi): AsyncValidatorFn => control =>
  timer(300).pipe(
    switchMap(() => api.exists(control.value)),
    map(exists => (exists ? { taken: true } : null)),
    catchError(() => of(null)),
  );
```

Points: async validators run only after the sync validators pass; while running, the status is `PENDING` (disable submit); returning a new Observable per keystroke cancels the previous one; `timer` gives debouncing; `updateOn: 'blur' | 'submit'` reduces validation and change noise.

---

## NgRx: actions, reducers, selectors, effects

The cycle: component **dispatches an action** → **reducer** (pure function) computes new state → **selectors** derive memoized slices → components read them → **effects** listen for actions, do side effects (HTTP), and dispatch new actions.

What interviewers want to hear:

- **Actions are events, not commands**: `[Search Page] Query Submitted`, not `setLoading`. The source in brackets helps debugging. Don't reuse one action from many places.
- **Reducers are pure and synchronous**: no HTTP, no `Date.now()`, no mutation.
- **Selectors are memoized** (`createSelector` remembers the last arguments). Derived data belongs in selectors, not in state. `store.selectSignal()` returns a signal.
- **Effects choose a flattening operator deliberately**: `switchMap` for search, `concatMap` for ordered saves, `exhaustMap` for login.
- Use **`@ngrx/entity`** for normalized collections.

---

## NgRx effects error handling

```ts
load$ = createEffect(() =>
  this.actions$.pipe(
    ofType(UsersActions.load),
    switchMap(() =>
      this.api.getUsers().pipe(
        map(users => UsersActions.loadSuccess({ users })),
        catchError(error => of(UsersActions.loadFailure({ error: error.message }))),   // ✓ inside
      ),
    ),
  ),
);
```

If `catchError` is placed on the **outer** stream, the first error completes the effect. NgRx's default error handler resubscribes a broken effect a limited number of times, but you lose the failure action and the effect can still die. Always catch inside the flattening operator and map the error to a failure action. Effects that don't dispatch need `{ dispatch: false }`, or they'll dispatch their input back and loop.

---

## When NgRx is overkill

Overkill when: the state is local to one feature, the app is small, most "state" is really server cache, or the team is new to RxJS. You get many files (actions, reducer, effects, selectors) for a simple fetch.

Worth it when: many features react to the same events, complex async workflows need a visible event log and devtools (time travel), large teams benefit from enforced conventions, or you need undo/redo or optimistic updates with rollback.

Answer pattern: "Start with signals in services, scoped per feature. Introduce NgRx (or SignalStore) for the parts of the app where the shared-event complexity is real. Consistency across the codebase matters more than the choice of library."

---

## NgRx SignalStore

A signals-first store built from composable features:

```ts
export const TodosStore = signalStore(
  { providedIn: 'root' },
  withState({ todos: [] as Todo[], filter: 'all' as Filter, loading: false }),
  withComputed(({ todos, filter }) => ({
    visible: computed(() => todos().filter(t => filter() === 'all' || (filter() === 'done') === t.done)),
  })),
  withMethods((store, api = inject(TodosApi)) => ({
    setFilter: (filter: Filter) => patchState(store, { filter }),
    load: rxMethod<void>(pipe(
      tap(() => patchState(store, { loading: true })),
      switchMap(() => api.getAll().pipe(
        tapResponse({ next: todos => patchState(store, { todos, loading: false }), error: () => patchState(store, { loading: false }) }),
      )),
    )),
  })),
  withHooks({ onInit: store => store.load() }),
);
```

Selling points: far less boilerplate than Redux; can be provided at root, route, or component level; reusable custom features (`withEntities`, a custom `withRequestStatus`); integrates RxJS where needed through `rxMethod`.

---

## Dynamic components

When the component type is known only at runtime (a dashboard widget registry, plugin-based layouts, modals):

```ts
const WIDGETS: Record<string, () => Promise<Type<unknown>>> = {
  chart: () => import('./chart.widget').then(m => m.ChartWidget),
  table: () => import('./table.widget').then(m => m.TableWidget),
};

@Component({ selector: 'app-widget-host', template: `<ng-container #host />` })
export class WidgetHostComponent {
  type = input.required<string>();
  config = input.required<unknown>();
  private host = viewChild.required('host', { read: ViewContainerRef });

  constructor() {
    effect(async () => {
      const cmp = await WIDGETS[this.type()]();
      this.host().clear();
      const ref = this.host().createComponent(cmp);
      ref.setInput('config', this.config());
    });
  }
}
```

Declarative alternative: `<ng-container *ngComponentOutlet="cmp(); inputs: { config: config() }" />`. Always use `setInput` (not direct property assignment), so OnPush and signal inputs update correctly. Components created this way are destroyed with the `ViewContainerRef`, or with `ref.destroy()`.

---

## Host bindings and listeners

```ts
@Component({
  selector: 'app-row',
  host: {
    role: 'row',
    '[class.selected]': 'selected()',
    '[attr.aria-selected]': 'selected()',
    '(click)': 'toggle()',
    '(window:resize)': 'onResize()',
    '(document:keydown.escape)': 'close()',
  },
  template: `…`,
})
export class RowComponent { selected = signal(false); toggle() { this.selected.update(v => !v); } }
```

The `host` object is the recommended style over `@HostBinding`/`@HostListener`. Global listeners (`window:`, `document:`) are removed automatically on destroy. In Zone apps, global high-frequency listeners like `window:scroll` trigger change detection on every event; use `runOutsideAngular` instead for those.

---

## SSR hydration mismatches and browser-only code

Hydration reuses the server-rendered DOM. Angular expects the client's first render to produce the **same DOM structure**. A mismatch shows as NG0500-series errors.

Causes:

- Direct DOM manipulation (`nativeElement.appendChild`, jQuery-style code, third-party libraries changing the DOM).
- Invalid HTML nesting that the browser's parser "fixes" (`<p><div>`, a `<table>` without `<tbody>`).
- Different data on server and client: `Date.now()`, `Math.random()`, the user's timezone, `localStorage` reads.
- Browser APIs (`window`, `document`, `localStorage`) used during rendering. These crash on the server.

Fixes: put browser-only code in `afterNextRender()`; `inject(PLATFORM_ID)` + `isPlatformBrowser`; transfer server data to the client (`HttpClient` caches server responses during hydration automatically); the `ngSkipHydration` attribute as a last resort for one component.

---

## Global error handling with ErrorHandler

```ts
@Injectable()
export class MonitoringErrorHandler implements ErrorHandler {
  private monitoring = inject(Monitoring);
  handleError(error: unknown) {
    this.monitoring.captureException(error, { route: location.pathname });
    console.error(error);
  }
}
// providers: [{ provide: ErrorHandler, useClass: MonitoringErrorHandler }]
```

It catches errors thrown in templates, lifecycle hooks, event handlers, and (in Zone apps) uncaught async errors. It doesn't catch `HttpClient` errors that you handled with `catchError`; report those in an interceptor. Angular has no per-component error boundary like React's. Isolate failures by catching errors per data stream and rendering an error state for that widget, and use `@defer`'s `@error` block for lazy-loading failures.

---

## Sanitization and bypassSecurityTrust

Angular sanitizes by context:

| Context | Binding | Sanitization |
| --- | --- | --- |
| HTML | `[innerHTML]` | Strips scripts, event handlers, and dangerous elements and attributes |
| Style | `[style]` | Removes unsafe values |
| URL | `[href]`, `[src]` | Blocks `javascript:` URLs |
| Resource URL | `<iframe [src]>`, `<script>` | Blocked unless explicitly trusted |

```ts
this.html = this.sanitizer.bypassSecurityTrustHtml(userContent);   // ✗ turns off protection: XSS if content is untrusted
this.el.nativeElement.innerHTML = userContent;                       // ✗ bypasses Angular entirely
```

Senior points: treat `bypassSecurityTrust*` as a code-review red flag that needs justification; render untrusted content (log lines, user comments) with interpolation or as text segments, never as HTML; add a CSP (Angular supports nonces through `CSP_NONCE`) as defense in depth; use Trusted Types where possible.

---

## Testing OnPush components

A classic trap:

```ts
const fixture = TestBed.createComponent(BadgeComponent);   // OnPush
fixture.componentInstance.count = 5;                        // direct property assignment
fixture.detectChanges();                                    // ✗ the view may not update: the component isn't marked dirty
```

`fixture.detectChanges()` checks from the host, but an OnPush component is skipped unless it's dirty, and assigning a property directly doesn't mark it dirty. Fixes:

```ts
fixture.componentRef.setInput('count', 5);   // marks the component for check, works for signal inputs too
fixture.detectChanges();                      // or: await fixture.whenStable() in zoneless tests
```

Or test through a small host component that binds the input, which is how the component is really used. Angular Testing Library's `render(Cmp, { inputs })` does this for you.

---

## fakeAsync, tick, and zoneless tests

```ts
it('debounces search', fakeAsync(() => {
  component.query.setValue('err');
  tick(299);
  expect(api.search).not.toHaveBeenCalled();
  tick(1);
  expect(api.search).toHaveBeenCalledWith('err');
}));
```

- `fakeAsync` runs the test in a fake zone where timers advance only with `tick(ms)`; `flush()` runs all pending timers; `flushMicrotasks()` runs pending promises. It throws if timers are left pending at the end ("1 periodic timer(s) still in the queue"), so clean up intervals.
- It needs `zone.js/testing`. In zoneless projects, use the test runner's fake timers (`vi.useFakeTimers()` / `jest.useFakeTimers()`) and `await fixture.whenStable()`.
- `waitForAsync` waits for real async work; it's slower and less deterministic.
- For complex RxJS logic, marble tests with `TestScheduler` are the most precise.

---

## Profiling with Angular DevTools

The browser extension shows:

- **Component tree**: inputs, outputs, state, signal values, and the injector tree (where each provider comes from, which helps debug "two instances" bugs).
- **Profiler**: each change detection cycle, what triggered it (an event, a timer), and how long each component took. Many cycles per second means zone pollution; a component that takes a long time on every cycle means template method calls or heavy `ngDoCheck`.
- Combine with the browser's Performance panel for scripting, layout, and paint, and with the Memory panel for leaks (detached DOM nodes, growing arrays).

Process to describe: reproduce → record → find the hot component or trigger → fix (OnPush, `track`, pure pipe, run outside Angular, virtualize) → measure again.

---

## Virtual scrolling with the CDK

```html
<cdk-virtual-scroll-viewport itemSize="32" minBufferPx="400" maxBufferPx="800" class="viewport">
  <div *cdkVirtualFor="let row of rows(); trackBy: trackById; templateCacheSize: 50" class="row">{{ row.message }}</div>
</cdk-virtual-scroll-viewport>
```

- Renders only visible rows plus a buffer; the viewport needs a fixed height.
- `itemSize` assumes **fixed row height**. Variable heights need the experimental autosize strategy or a custom `VirtualScrollStrategy`. Often the better UX is fixed rows with details in a side panel.
- Combine with infinite loading: listen to `scrolledIndexChange` and fetch the next page near the end.
- Pitfalls: sticky headers and tables need extra work; `Ctrl+F` browser search can't find rows that aren't rendered; screen readers see only rendered rows, so announce the total count.

---

## Migrating NgModules to standalone, signals, and zoneless

A typical senior question for a company with a large, long-lived codebase. Answer with an incremental plan:

1. **Standalone**: run `ng generate @angular/core:standalone` in steps (convert components, remove unnecessary modules, bootstrap with `bootstrapApplication`). Lazy routes become `loadComponent`/`loadChildren` with route files.
2. **Control flow**: `ng generate @angular/core:control-flow` to migrate `*ngIf`/`*ngFor` to `@if`/`@for`.
3. **Signal inputs, outputs, and queries**: Angular ships migration schematics for these too. Review them, because some patterns (inputs mutated inside the component) need manual work.
4. **OnPush everywhere**, feature by feature. Fix mutation bugs and add `track` along the way.
5. **State**: new code uses signals; at the boundaries with RxJS-heavy code use `toSignal`/`toObservable`, and don't rewrite working streams just for fashion.
6. **Zoneless**: once OnPush and signals or the `async` pipe cover the app, remove code relying on Zone (`onStable`, plain fields mutated in callbacks), update tests, then switch with `provideZonelessChangeDetection()`.

Throughout: lint rules to prevent new old-style code, feature flags and monitoring (errors, performance) per step, and continuous feature work instead of a big-bang rewrite.

---

## Angular vs React

Say it neutrally; interviewers dislike framework tribalism.

| Topic | Angular | React |
| --- | --- | --- |
| Type | Full framework: router, forms, HTTP, DI, testing, CLI | UI library plus an ecosystem you choose |
| Rendering | Compiled templates update the DOM directly; change detection decides what to check | Re-render components into a virtual DOM, then reconcile |
| Reactivity | Signals (fine-grained) plus RxJS; Zone.js historically | State plus re-render; the compiler can automate memoization |
| Code sharing | Services and DI, directives | Hooks and context |
| Styling | Encapsulated component styles by default | Your choice (CSS modules, CSS-in-JS, Tailwind) |
| Strengths | Consistency across large teams, batteries included, strong conventions, long-term upgrade tooling (`ng update`) | Flexibility, huge ecosystem, simpler mental model for small apps, server components |
| Costs | More concepts to learn (DI, RxJS, decorators), more ceremony | Decision fatigue, inconsistency between teams, more libraries to integrate and maintain |

Closing line: "Both solve the same problems: state, rendering, and composition. For a large, long-lived enterprise product with many teams, Angular's built-in conventions are a real advantage; the core skills like architecture, performance, and testing carry over between them."
