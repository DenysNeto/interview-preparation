# JavaScript Interview Study Guide: Angular

Concise, answer-first explanations you can say aloud in an interview. Targets modern Angular (standalone, signals, built-in control flow, zoneless) while covering the older APIs that large codebases still use. Tricky follow-ups are in [tricky-angular-interview-answers.md](tricky-angular-interview-answers.md). Вопросы на русском: [angular-questions.ru.md](angular-questions.ru.md).

---

## Components and Templates

### What is an Angular component?

A class with a `@Component` decorator that pairs a template, styles, and a selector. Angular compiles the template ahead of time into instructions that create and update the DOM directly; there is no virtual DOM.

```ts
@Component({
  selector: 'app-user-card',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3>{{ user().name }}</h3>
    <small>Joined {{ user().joinedAt | date }}</small>
    <button (click)="follow.emit(user().id)">Follow</button>
  `,
})
export class UserCardComponent {
  user = input.required<User>();
  follow = output<string>();
}
```

### What kinds of data binding exist?

| Syntax | Direction | Example |
| --- | --- | --- |
| `{{ expr }}` | Class → DOM text (escaped) | `{{ user().name }}` |
| `[prop]="expr"` | Class → DOM property / child input | `[disabled]="saving()"` |
| `(event)="handler($event)"` | DOM / child output → class | `(click)="save()"` |
| `[(value)]="sig"` | Two-way (property + `valueChange` event) | `[(ngModel)]="name"` |
| `[attr.x]`, `[class.x]`, `[style.x.px]` | Attribute / class / style bindings | `[attr.aria-label]="label"` |

Property binding targets DOM **properties**, not HTML attributes. Use `[attr.colspan]` for attributes that have no property.

---

## Standalone Components vs NgModules

### What changed with standalone components?

Components declare their own template dependencies in `imports`; no NgModule is needed. Standalone is the default in recent versions. The app boots with `bootstrapApplication(AppComponent, { providers: [...] })`, and features are configured with `provideX()` functions (`provideRouter`, `provideHttpClient`).

### What did NgModules do, and why do you still need to know them?

An NgModule grouped `declarations` (components, directives, pipes), `imports`, `exports`, and `providers`, and defined a compilation context. Large apps still have them. Know `forRoot()`/`forChild()` (one module, different providers for root vs lazy features), and that providers in a lazy-loaded module create a child injector, so the service gets a separate instance there.

---

## Inputs, Outputs, and Two-Way Binding

### How do components communicate?

- Parent → child: `input()` / `input.required()` (or the decorator `@Input()`).
- Child → parent: `output()` (or `@Output() x = new EventEmitter<T>()`).
- Two-way: `model()` in the child; the parent binds `[(value)]="signalOrField"`.
- Siblings or distant components: a shared service (often signal-based) or a store.

```ts
query = model('');                        // parent: <app-search [(query)]="q" />
pageSize = input(50, { transform: numberAttribute });
selected = output<LogEntry>();
```

Signal inputs are read-only signals, so derived values use `computed()` instead of `ngOnChanges`.

---

## Built-in Control Flow and `@defer`

### What replaced `*ngIf` and `*ngFor`?

Built-in blocks compiled into the template, with no import needed:

```html
@if (user(); as u) { <p>{{ u.name }}</p> } @else { <p>Guest</p> }

@for (item of items(); track item.id; let i = $index, last = $last) {
  <app-row [item]="item" />
} @empty {
  <p>Nothing here</p>
}

@switch (status()) {
  @case ('loading') { <app-spinner /> }
  @default { <app-content /> }
}

@let total = items().length;
```

`track` is required and works like React's `key`. The old structural directives still work and you'll see them in older code.

### What does `@defer` do?

It lazy-loads part of a template as a separate chunk when a trigger fires: `on viewport`, `on idle` (the default), `on interaction`, `on hover`, `on timer(2s)`, `on immediate`, or `when condition`. It supports `@placeholder`, `@loading`, `@error` and `prefetch on …`. Everything inside must be standalone and not referenced elsewhere in the same file, or it gets bundled eagerly.

---

## Directives

### What kinds of directives are there?

- **Components**: directives with a template.
- **Attribute directives** change the behavior or look of an existing element (`appTooltip`, `appAutofocus`, `ngClass`).
- **Structural directives** add or remove templates (`*ngIf`, `*ngFor`, or a custom `*appHasRole`). They use `TemplateRef` + `ViewContainerRef`.
- **Host directives** (`hostDirectives: [...]`) compose directive behavior into a component without inheritance.

```ts
@Directive({
  selector: '[appAutofocus]',
  host: { '(focusout)': 'touched.set(true)' },
})
export class AutofocusDirective {
  private el = inject(ElementRef<HTMLElement>);
  touched = signal(false);
  constructor() {
    afterNextRender(() => this.el.nativeElement.focus());
  }
}
```

Prefer the `host` metadata object over `@HostBinding`/`@HostListener` in new code.

---

## Pipes

### What is a pipe, and what does "pure" mean?

A pipe transforms a value in the template: `{{ price | currency: 'EUR' }}`. A **pure** pipe (the default) runs again only when its input changes by reference or its arguments change, so it acts like a memoized function. An **impure** pipe (`pure: false`) runs on every change detection pass. `async` is impure because it must check for new emissions.

```ts
@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(ms: number): string {
    return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`;
  }
}
```

### What does the `async` pipe do?

It subscribes to an Observable or Promise, returns the latest value, calls `markForCheck()` on each emission (so it works with OnPush), and unsubscribes on destroy.

---

## Content Projection and Templates

### How do you pass markup into a component?

With `<ng-content>`, which is Angular's version of `children`. Multi-slot projection uses `select`:

```html
<!-- card.component.html -->
<header><ng-content select="[card-title]" /></header>
<ng-content />
```

### What are `ng-template`, `ng-container`, and `ngTemplateOutlet`?

- `ng-template` defines a template that isn't rendered until something instantiates it. It's the closest thing to a render prop.
- `ng-container` is a grouping element that produces no DOM node, like a React Fragment.
- `ngTemplateOutlet` renders a template with a context, which makes customizable cells or rows possible:

```html
<ng-container *ngTemplateOutlet="rowTpl(); context: { $implicit: row, index: i }" />
```

---

## View and Content Queries

### What's the difference between `viewChild` and `contentChild`?

`viewChild` finds elements in the component's **own template**. `contentChild` finds elements **projected in** by the parent. The signal versions (`viewChild()`, `viewChildren()`, `contentChild()`, `contentChildren()`) update automatically. The decorator versions are available after `ngAfterViewInit` / `ngAfterContentInit`.

```ts
canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chart');
tabs = contentChildren(TabComponent);
```

---

## Lifecycle Hooks

### What is the lifecycle order?

`constructor` → `ngOnChanges` (when inputs are set) → `ngOnInit` → `ngDoCheck` → `ngAfterContentInit` → `ngAfterContentChecked` → `ngAfterViewInit` → `ngAfterViewChecked` → (repeat checks on updates) → `ngOnDestroy`.

### What are the modern alternatives?

- Derived state: `computed()` instead of `ngOnChanges`.
- Cleanup: `inject(DestroyRef).onDestroy(...)` or `takeUntilDestroyed()`.
- DOM work after rendering: `afterNextRender()` (once) and `afterEveryRender()` (every render). These are safe for SSR because they run only in the browser.

---

## Signals

### What are signals?

Reactive values that notify their readers when they change. They are synchronous, fine-grained, and glitch-free.

```ts
const count = signal(0);
const double = computed(() => count() * 2);     // lazy + memoized
effect(() => console.log(double()));             // side effect, re-runs on change
count.update(c => c + 1);
```

- `signal`: writable state (`set`, `update`, `asReadonly`).
- `computed`: derived, read-only, cached until a dependency changes.
- `effect`: side effects toward the outside world (localStorage, logging, imperative libraries).
- `linkedSignal`: writable state that resets when its source changes.
- `resource` / `httpResource` / `rxResource`: async data exposed as signals.
- `untracked`: read a signal without depending on it.

### Signals vs RxJS?

Signals hold **state**: a current value the template reads. RxJS handles **events over time**: debouncing, cancelling, retrying, combining async sources, websockets. Bridge them with `toSignal()` and `toObservable()`.

---

## Dependency Injection

### How does DI work in Angular?

Classes and values are registered with providers and requested with `inject()` (or constructor parameters). Angular creates and caches instances in **injectors**.

```ts
@Injectable({ providedIn: 'root' })
export class UsersApi {
  private http = inject(HttpClient);
  getUser(id: string) { return this.http.get<User>(`/api/users/${id}`); }
}

export const API_URL = new InjectionToken<string>('API_URL');
// providers: [{ provide: API_URL, useValue: '/api' }]
```

### What does the injector hierarchy look like?

1. **Element injectors**, from `providers` on components and directives: one instance per component instance, visible to its subtree.
2. **Environment injectors**: root (`providedIn: 'root'`, `bootstrapApplication` providers) and route-level (`providers` on a lazy route).
3. Platform → null injector, which throws `NullInjectorError`.

Lookup walks up the element injectors first, then the environment injectors.

### What provider types exist?

`useClass`, `useValue`, `useFactory`, `useExisting` (an alias to the same instance), and `multi: true` (collect several values under one token).

---

## Change Detection

### How does Angular know when to update the view?

**With Zone.js (classic):** Zone.js patches async APIs (events, timers, XHR, promises). After each async task, Angular checks the component tree from the top, compares each binding to its previous value, and updates the DOM where something differs.

**OnPush:** a component and its subtree are skipped unless an input reference changed, an event fired in its template, `markForCheck()` was called (the `async` pipe does this), or a signal read in its template changed.

**Zoneless (`provideZonelessChangeDetection()`, the default for new apps in the latest versions):** no Zone.js. Change detection is scheduled only by signal changes, `markForCheck`, template events, and input changes. The result is a smaller bundle, fewer wasted checks, and cleaner stack traces.

---

## Routing

### What are the core router features?

- Lazy loading: `loadComponent` for one component, `loadChildren` for a set of child routes.
- Functional guards: `canActivate`, `canActivateChild`, `canDeactivate`, `canMatch`.
- Resolvers: prefetch data before activating a route.
- Params: `ActivatedRoute.paramMap` / `queryParamMap`, or bind them to component inputs with `withComponentInputBinding()`.
- Route-level `providers` for feature-scoped services.

```ts
export const routes: Routes = [
  {
    path: 'users/:id',
    loadComponent: () => import('./user.page').then(m => m.UserPage),
    canActivate: [() => inject(AuthService).isLoggedIn() || inject(Router).parseUrl('/login')],
  },
];
```

---

## Forms

### Reactive forms vs template-driven forms?

- **Reactive** (`FormControl`, `FormGroup`, `FormArray`, `FormRecord`): the model is defined in the class, it's typed, testable, and suits complex or dynamic forms. Value changes are exposed as Observables.
- **Template-driven** (`ngModel`): the model is defined in the template. Simpler for small forms, but harder to test and to build dynamically.
- **Signal forms**: an experimental, signal-based forms API in the newest versions.

```ts
private fb = inject(NonNullableFormBuilder);
form = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', Validators.minLength(8)],
});
```

### How do you make a custom input work with forms?

Implement `ControlValueAccessor` (`writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`) and provide `NG_VALUE_ACCESSOR`.

---

## HTTP

### How does `HttpClient` work?

It returns **cold** Observables: the request is sent on subscribe, each subscription sends a new request, and unsubscribing cancels it. Configure it with `provideHttpClient(withInterceptors([...]), withFetch())`.

### What are interceptors for?

Cross-cutting request and response logic: auth headers, retries, error handling, logging, caching, correlation ids. In modern Angular they're functions:

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ setHeaders: { Authorization: `Bearer ${inject(Auth).token()}` } }));
```

---

## RxJS in Angular

### Where does Angular use RxJS?

`HttpClient`, router events and params, reactive forms `valueChanges`, `EventEmitter` (a Subject underneath), NgRx. Know the flattening operators (`switchMap`, `mergeMap`, `concatMap`, `exhaustMap`), `debounceTime`, `distinctUntilChanged`, `combineLatest`, `catchError`, `shareReplay`, and how to unsubscribe (`async` pipe, `toSignal`, `takeUntilDestroyed`).

---

## State Management

### What are the options?

| Option | When |
| --- | --- |
| Component signals | Local UI state |
| Signal-based service (`@Injectable` + signals) | Shared feature state, the default for most apps |
| NgRx SignalStore | Structured stores with less boilerplate; can be scoped to a component or route |
| NgRx Store (Redux) + Effects | Large apps and teams, many features reacting to the same events, devtools needed |
| URL (router query params) | Shareable state: filters, tabs, selection |

---

## Performance

### What are the main levers?

OnPush everywhere with immutable data; signals; `track` in every `@for`; no function calls in templates (use pure pipes or `computed`); lazy routes and `@defer`; CDK virtual scrolling for long lists; `NgZone.runOutsideAngular` for high-frequency events in Zone apps; Web Workers for heavy computation; zoneless; budgets in `angular.json`; profiling with Angular DevTools.

---

## SSR and Hydration

### How does Angular SSR work?

`@angular/ssr` renders HTML on the server; `provideClientHydration()` reuses that DOM in the browser instead of re-creating it. Options include event replay (clicks made before hydration aren't lost) and incremental hydration (`@defer (hydrate on viewport)`). Browser-only code goes in `afterNextRender` or behind `isPlatformBrowser`.

---

## Testing

### How do you test Angular code?

- Runner: Jest or Vitest (Karma is deprecated).
- `TestBed` configures a testing injector and creates components (`TestBed.createComponent`).
- Angular Testing Library for user-centric component tests.
- CDK Component Harnesses for interacting with Material/CDK components and your own design-system components.
- `provideHttpClientTesting()` + `HttpTestingController` to mock HTTP.
- `fakeAsync`/`tick` (Zone apps) or fake timers / `await fixture.whenStable()` (zoneless) for time.
- Playwright or Cypress for end-to-end tests.

---

## Security

### How does Angular protect against XSS?

Interpolation is always escaped. Values bound to `[innerHTML]`, `[style]`, `[href]`/`[src]` (URLs), and resource URLs are sanitized for their context. `DomSanitizer.bypassSecurityTrust*()` turns that protection off and should be rare and reviewed. Writing to the DOM directly (`nativeElement.innerHTML = ...`) bypasses Angular entirely. `HttpClient` supports XSRF tokens automatically for cookie-based auth.

---

## Tooling

### What does the Angular CLI give you?

`ng new`, `ng generate`, `ng serve` (Vite dev server), and `ng build` (esbuild-based application builder) with bundle budgets; `ng update` with automatic migrations; and schematics (for example, the standalone, control-flow, and signal-input migrations). Large codebases often use Nx on top of it for monorepos.
