# Angular Live Coding — Observability Flavour

Rules: timer on, no AI autocomplete, think aloud, working minimum first. General live-coding behaviour: [interview-strategy.md](../danil-interview-preparation/interview-strategy.md).

Setup once: `npx @angular/cli@latest new cx-live --style=scss --ssr=false`, and have a StackBlitz Angular template bookmarked as a backup.

Shared types used below:

```ts
export type Severity = 'debug' | 'info' | 'warning' | 'error' | 'critical';
export interface LogEntry {
  id: string;
  timestamp: number;
  severity: Severity;
  service: string;
  message: string;
  traceId?: string;
}
```

Progress:

- [ ] 1. Service name typeahead (30 min)
- [ ] 2. Logs table with filters and facet counts (40 min)
- [ ] 3. Time range picker synced to URL (30 min)
- [ ] 4. Service health polling widget (30 min)
- [ ] 5. Fix the buggy component (15 min)
- [ ] 6. Recursive JSON viewer (30 min)
- [ ] 7. Severity multi-select as a form control (`ControlValueAccessor`) (30 min)
- [ ] 8. Live tail with batching and pause (35 min)

---

## 1. Service name typeahead (30 min)

Build an input that suggests service names from `ServicesApi.search(q: string): Observable<string[]>`.

Requirements: debounce 250 ms, min 2 chars, cancel stale requests, loading / error / empty states, keyboard: ↑ ↓ Enter Esc, accessible combobox.

<details>
<summary>Solution</summary>

```ts
type SuggestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; items: string[] }
  | { status: 'error' };

@Component({
  selector: 'cx-service-typeahead',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      role="combobox"
      aria-autocomplete="list"
      aria-controls="svc-list"
      [attr.aria-expanded]="open()"
      [attr.aria-activedescendant]="activeIndex() >= 0 ? 'svc-' + activeIndex() : null"
      [formControl]="query"
      (keydown)="onKey($event)"
      placeholder="Service name"
    />
    @if (open()) {
      <ul id="svc-list" role="listbox">
        @switch (state().status) {
          @case ('loading') { <li aria-disabled="true">Loading…</li> }
          @case ('error') { <li aria-disabled="true">Failed to load suggestions</li> }
          @case ('success') {
            @for (item of items(); track item; let i = $index) {
              <li
                [id]="'svc-' + i"
                role="option"
                [attr.aria-selected]="i === activeIndex()"
                (mousedown)="choose(item)"
              >{{ item }}</li>
            } @empty {
              <li aria-disabled="true">No services found</li>
            }
          }
        }
      </ul>
    }
  `,
})
export class ServiceTypeaheadComponent {
  private api = inject(ServicesApi);
  selected = output<string>();

  query = new FormControl('', { nonNullable: true });
  activeIndex = signal(-1);
  dismissed = signal(false);

  state = toSignal(
    this.query.valueChanges.pipe(
      map(q => q.trim()),
      debounceTime(250),
      distinctUntilChanged(),
      tap(() => {
        this.activeIndex.set(-1);
        this.dismissed.set(false);
      }),
      switchMap((q): Observable<SuggestState> =>
        q.length < 2
          ? of({ status: 'idle' })
          : this.api.search(q).pipe(
              map(items => ({ status: 'success', items }) as const),
              catchError(() => of({ status: 'error' } as const)),
              startWith({ status: 'loading' } as const),
            ),
      ),
    ),
    { initialValue: { status: 'idle' } as SuggestState },
  );

  items = computed(() => {
    const s = this.state();
    return s.status === 'success' ? s.items : [];
  });
  open = computed(() => this.state().status !== 'idle' && !this.dismissed());

  onKey(e: KeyboardEvent) {
    const n = this.items().length;
    if (e.key === 'ArrowDown' && n) {
      e.preventDefault();
      this.activeIndex.update(i => (i + 1) % n);
    } else if (e.key === 'ArrowUp' && n) {
      e.preventDefault();
      this.activeIndex.update(i => (i <= 0 ? n - 1 : i - 1));
    } else if (e.key === 'Enter' && this.activeIndex() >= 0) {
      this.choose(this.items()[this.activeIndex()]);
    } else if (e.key === 'Escape') {
      this.dismissed.set(true);
    }
  }

  choose(item: string) {
    this.query.setValue(item, { emitEvent: false });
    this.dismissed.set(true);
    this.selected.emit(item);
  }
}
```

Talking points: `catchError` inside `switchMap`; `mousedown` instead of `click` so the input blur doesn't close the list first; `emitEvent: false` to avoid re-searching the chosen value; cache results by prefix as a follow-up.

</details>

---

## 2. Logs table with filters and facet counts (40 min)

Given `logs = input.required<LogEntry[]>()` (≈50k items), build:

- Text search (case-insensitive on message), severity checkboxes with **counts** that reflect the text search, service dropdown.
- Virtualized list (CDK) of results, row click opens a detail panel.
- Counts and filtering must not recompute when unrelated state changes.

<details>
<summary>Solution</summary>

```ts
const SEVERITIES: Severity[] = ['debug', 'info', 'warning', 'error', 'critical'];

@Component({
  selector: 'cx-logs-table',
  imports: [ScrollingModule, FormsModule, DatePipe, JsonPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <input type="search" placeholder="Search message" [ngModel]="text()" (ngModelChange)="text.set($event)" />
      <select [ngModel]="service()" (ngModelChange)="service.set($event)">
        <option value="">All services</option>
        @for (s of services(); track s) { <option [value]="s">{{ s }}</option> }
      </select>
      @for (sev of severities; track sev) {
        <label>
          <input type="checkbox" [checked]="selectedSeverities().has(sev)" (change)="toggle(sev)" />
          {{ sev }} ({{ severityCounts()[sev] }})
        </label>
      }
    </div>

    <p>{{ filtered().length }} results</p>

    <cdk-virtual-scroll-viewport itemSize="28" class="viewport">
      <div
        *cdkVirtualFor="let log of filtered(); trackBy: trackById"
        class="row"
        [class.active]="log.id === selectedId()"
        (click)="selectedId.set(log.id)"
      >
        <time>{{ log.timestamp | date: 'HH:mm:ss.SSS' }}</time>
        <span [class]="'sev sev--' + log.severity">{{ log.severity }}</span>
        <span>{{ log.service }}</span>
        <span class="msg">{{ log.message }}</span>
      </div>
    </cdk-virtual-scroll-viewport>

    @if (selected(); as log) {
      <aside class="detail"><pre>{{ log | json }}</pre></aside>
    }
  `,
  styles: `.viewport { height: 600px; } .row { height: 28px; display: flex; gap: 8px; white-space: nowrap; }`,
})
export class LogsTableComponent {
  logs = input.required<LogEntry[]>();
  severities = SEVERITIES;

  text = signal('');
  service = signal('');
  selectedSeverities = signal<ReadonlySet<Severity>>(new Set());
  selectedId = signal<string | null>(null);

  private debouncedText = toSignal(toObservable(this.text).pipe(debounceTime(200)), { initialValue: '' });

  services = computed(() => [...new Set(this.logs().map(l => l.service))].sort());

  private textAndServiceMatches = computed(() => {
    const t = this.debouncedText().toLowerCase();
    const svc = this.service();
    return this.logs().filter(l => (!svc || l.service === svc) && (!t || l.message.toLowerCase().includes(t)));
  });

  severityCounts = computed(() => {
    const counts = Object.fromEntries(SEVERITIES.map(s => [s, 0])) as Record<Severity, number>;
    for (const l of this.textAndServiceMatches()) counts[l.severity]++;
    return counts;
  });

  filtered = computed(() => {
    const sev = this.selectedSeverities();
    const base = this.textAndServiceMatches();
    return sev.size ? base.filter(l => sev.has(l.severity)) : base;
  });

  selected = computed(() => this.logs().find(l => l.id === this.selectedId()) ?? null);

  toggle(s: Severity) {
    this.selectedSeverities.update(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  }

  trackById = (_: number, l: LogEntry) => l.id;
}
```
Talking points: facet counts computed **before** applying the severity filter (standard faceting UX — otherwise unchecked options always show 0); chained `computed`s so changing severity doesn't redo text filtering; new `Set` on toggle for immutability; at real scale this moves server-side or to a worker; detail in a side panel keeps row heights fixed for virtualization.

</details>

---

## 3. Time range picker synced to URL (30 min)

Presets (`15m`, `1h`, `24h`, `7d`) + custom absolute range. State lives in query params `from`/`to` (`from=now-15m` or epoch ms). The page should show the resolved absolute range, and Back/Forward must work.

<details>
<summary>Solution</summary>

```ts
export type TimeRange = { kind: 'relative'; minutes: number } | { kind: 'absolute'; from: number; to: number };

const PRESETS = [
  { label: 'Last 15 minutes', minutes: 15 },
  { label: 'Last 1 hour', minutes: 60 },
  { label: 'Last 24 hours', minutes: 1440 },
  { label: 'Last 7 days', minutes: 10080 },
];

export function parseRange(params: ParamMap): TimeRange {
  const from = params.get('from');
  const to = params.get('to');
  const rel = from?.match(/^now-(\d+)m$/);
  if (rel) return { kind: 'relative', minutes: Number(rel[1]) };
  const f = Number(from);
  const t = Number(to);
  if (Number.isFinite(f) && Number.isFinite(t) && f < t) return { kind: 'absolute', from: f, to: t };
  return { kind: 'relative', minutes: 15 };
}

export function serializeRange(r: TimeRange): Params {
  return r.kind === 'relative' ? { from: `now-${r.minutes}m`, to: null } : { from: r.from, to: r.to };
}

export function resolveRange(r: TimeRange, now = Date.now()) {
  return r.kind === 'relative' ? { from: now - r.minutes * 60_000, to: now } : { from: r.from, to: r.to };
}

@Component({
  selector: 'cx-time-range',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (p of presets; track p.minutes) {
      <button
        type="button"
        [attr.aria-pressed]="range().kind === 'relative' && $any(range()).minutes === p.minutes"
        (click)="set({ kind: 'relative', minutes: p.minutes })"
      >{{ p.label }}</button>
    }
    <input #from type="datetime-local" />
    <input #to type="datetime-local" />
    <button type="button" (click)="applyCustom(from.value, to.value)">Apply</button>
    <p>{{ resolved().from | date: 'medium' }} → {{ resolved().to | date: 'medium' }}</p>
  `,
})
export class TimeRangeComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  presets = PRESETS;

  range = toSignal(this.route.queryParamMap.pipe(map(parseRange)), { requireSync: true });
  resolved = computed(() => resolveRange(this.range()));

  set(r: TimeRange) {
    this.router.navigate([], { queryParams: serializeRange(r), queryParamsHandling: 'merge' });
  }

  applyCustom(from: string, to: string) {
    const f = new Date(from).getTime();
    const t = new Date(to).getTime();
    if (Number.isFinite(f) && Number.isFinite(t) && f < t) this.set({ kind: 'absolute', from: f, to: t });
  }
}
```

Talking points: URL is the single source of truth, so Back/Forward works for free; parse defensively (URL is user input); relative stays relative in shared links; `resolved` is computed once per range change — for "auto-refresh" you'd add a `now` signal ticking on an interval; timezone display (user preference vs UTC) is a real product decision in observability tools; `null` in queryParams removes `to`.

</details>

---

## 4. Service health polling widget (30 min)

`HealthApi.get(service): Observable<{ status: 'ok' | 'degraded' | 'down'; p95Ms: number; errorRate: number }>`.

Poll every 10 s; pause when the tab is hidden; if a request is still running, skip the tick; on errors, keep the last known value, show "stale since HH:mm:ss", and back off exponentially (max 60 s); restart immediately when `service` input changes.

<details>
<summary>Solution</summary>

```ts
type Health = { status: 'ok' | 'degraded' | 'down'; p95Ms: number; errorRate: number };
type View = { data: Health | null; staleSince: number | null };

@Component({
  selector: 'cx-health',
  imports: [DatePipe, DecimalPipe, PercentPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (view().data; as h) {
      <span [class]="'dot dot--' + h.status"></span>
      p95 {{ h.p95Ms | number: '1.0-0' }} ms · errors {{ h.errorRate | percent: '1.1-1' }}
    } @else {
      Loading…
    }
    @if (view().staleSince; as t) { <small>stale since {{ t | date: 'HH:mm:ss' }}</small> }
  `,
})
export class HealthComponent {
  private api = inject(HealthApi);
  service = input.required<string>();

  private visible$ = fromEvent(document, 'visibilitychange').pipe(
    startWith(null),
    map(() => document.visibilityState === 'visible'),
    distinctUntilChanged(),
  );

  view = toSignal(
    combineLatest([toObservable(this.service), this.visible$]).pipe(
      switchMap(([svc, visible]) => (visible ? this.poll(svc) : EMPTY)),
      scan(
        (acc: View, ev: { ok: true; data: Health } | { ok: false }): View =>
          ev.ok ? { data: ev.data, staleSince: null } : { data: acc.data, staleSince: acc.staleSince ?? Date.now() },
        { data: null, staleSince: null },
      ),
    ),
    { initialValue: { data: null, staleSince: null } as View },
  );

  private poll(svc: string) {
    let failures = 0;
    const request$ = defer(() => this.api.get(svc)).pipe(
      map(data => {
        failures = 0;
        return { ok: true as const, data };
      }),
      catchError(() => {
        failures++;
        return of({ ok: false as const });
      }),
    );
    const wait$ = defer(() => timer(failures ? Math.min(60_000, 10_000 * 2 ** failures) : 10_000));
    return request$.pipe(concatWith(wait$.pipe(ignoreElements())), repeat());
  }
}
```

Talking points: request → wait → `repeat` means calls never overlap (so no `exhaustMap` needed); the wait is wrapped in `defer` so its length is computed *after* the request, using the updated failure count; the `scan` keeps the last good value; `switchMap` on service/visibility restarts or pauses cleanly; `toSignal` cleans up on destroy. Simpler alternative to mention: `timer(0, 10_000).pipe(exhaustMap(...))` without backoff.

</details>

---

## 5. Fix the buggy component (15 min)

Find all bugs and explain each.

```ts
@Component({
  selector: 'cx-errors-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input (input)="search($event.target.value)" />
    <div *ngFor="let e of errors">{{ formatTime(e.timestamp) }} {{ e.message }}</div>
    <div [innerHTML]="highlight(selected?.message)"></div>
  `,
})
export class ErrorsPanelComponent implements OnInit {
  @Input() service!: string;
  errors: LogEntry[] = [];
  selected?: LogEntry;

  constructor(private api: LogsApi, private store: Store) {}

  ngOnInit() {
    this.store.select(selectLiveErrors).subscribe(newErrors => {
      newErrors.forEach(e => this.errors.push(e));
    });
  }

  search(text: string) {
    this.api.search(this.service, text).subscribe(res => {
      this.api.details(res[0].id).subscribe(d => (this.selected = d));
    });
  }

  formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString();
  }

  highlight(msg?: string) {
    return msg?.replace(/error/gi, m => `<b>${m}</b>`);
  }
}
```

<details>
<summary>Answers</summary>

1. **Leak**: store subscription never unsubscribed → `takeUntilDestroyed` / `toSignal`.
2. **Mutation with OnPush**: `push` into the same array → view doesn't update (and in Zone apps it updates only by accident). Use immutable updates, a signal, and cap the length.
3. **Unbounded growth**: live errors appended forever → memory leak in long sessions; cap / ring buffer.
4. **No `trackBy`** → DOM recreated on every change.
5. **Method in template** (`formatTime`) runs every CD for every row → `date` pipe.
6. **Nested subscribe + no cancellation** → race conditions (old search overwrites newer), no debounce → `debounceTime` + `switchMap`.
7. `res[0]` may be undefined → crash on empty results; no error handling.
8. `service` input changes are ignored (search uses the stale value only on typing) → make it a signal input and include it in the stream.
9. **XSS risk / broken highlighting**: building HTML from log content. Angular's sanitizer strips scripts, but it still interprets markup from logs (`<img>` is allowed, attributes stripped — still wrong). Render segments with `<mark>` in the template instead (see task 4 in [10-live-coding-data-algorithms.md](10-live-coding-data-algorithms.md)).
10. `$event.target.value` — `target` is typed `EventTarget | null`; fails with strict templates. Use a form control or `$any($event.target).value`, or a template ref.
11. Old-style `*ngFor` without importing `NgFor` in a standalone component → template error (use `@for`).

Fixed core:

```ts
service = input.required<string>();
private text = signal('');

liveErrors = toSignal(
  this.store.select(selectLiveErrors).pipe(
    scan((acc, batch) => [...batch, ...acc].slice(0, 500), [] as LogEntry[]),
  ),
  { initialValue: [] },
);

selected = toSignal(
  combineLatest([toObservable(this.service), toObservable(this.text).pipe(debounceTime(300))]).pipe(
    switchMap(([svc, text]) =>
      this.api.search(svc, text).pipe(
        switchMap(res => (res.length ? this.api.details(res[0].id) : of(undefined))),
        catchError(() => of(undefined)),
      ),
    ),
  ),
);
```

</details>

---

## 6. Recursive JSON viewer (30 min)

Render an arbitrary JSON value (log payload) as a collapsible tree. Objects/arrays collapsed beyond depth 1 by default, show `{…} 12 keys` / `[…] 300 items`, click to toggle, color by type, "copy path" on hover. Must handle 5,000-item arrays without freezing.

<details>
<summary>Solution</summary>

```ts
@Component({
  selector: 'cx-json-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isContainer()) {
      <button type="button" class="toggle" [attr.aria-expanded]="expanded()" (click)="expanded.set(!expanded())">
        {{ expanded() ? '▾' : '▸' }} @if (name() !== null) { <span class="key">{{ name() }}:</span> }
        <span class="summary">{{ isArray() ? '[…] ' + entries().length + ' items' : '{…} ' + entries().length + ' keys' }}</span>
      </button>
      @if (expanded()) {
        <ul role="group">
          @for (e of visibleEntries(); track e[0]) {
            <li><cx-json-node [name]="e[0]" [value]="e[1]" [depth]="depth() + 1" [path]="childPath(e[0])" /></li>
          }
          @if (entries().length > limit()) {
            <li><button type="button" (click)="limit.set(limit() + 100)">Show 100 more ({{ entries().length - limit() }} left)</button></li>
          }
        </ul>
      }
    } @else {
      @if (name() !== null) { <span class="key">{{ name() }}:</span> }
      <span [class]="'val val--' + type()" [title]="path()">{{ display() }}</span>
    }
  `,
})
export class JsonNodeComponent {
  value = input.required<unknown>();
  name = input<string | null>(null);
  depth = input(0);
  path = input('$');

  isArray = computed(() => Array.isArray(this.value()));
  isContainer = computed(() => typeof this.value() === 'object' && this.value() !== null);
  type = computed(() => (this.value() === null ? 'null' : typeof this.value()));
  entries = computed(() => (this.isContainer() ? Object.entries(this.value() as object) : []));

  expanded = linkedSignal(() => this.depth() < 1);
  limit = signal(100);
  visibleEntries = computed(() => this.entries().slice(0, this.limit()));

  display = computed(() => (typeof this.value() === 'string' ? `"${this.value()}"` : String(this.value())));
  childPath(key: string) {
    return this.isArray() ? `${this.path()}[${key}]` : `${this.path()}.${key}`;
  }
}
```

Talking points: a standalone component can render itself recursively without importing itself; lazy rendering (children only when expanded) + "show more" paging instead of rendering 5,000 nodes; text interpolation means no XSS; next steps: keyboard tree navigation (`role="tree"`, arrow keys), search within JSON, virtualization by flattening the visible tree into a list (same technique as the trace waterfall).

</details>

---

## 7. Severity multi-select as a form control (30 min)

Make `<cx-severity-select formControlName="severities" />` work with Reactive Forms: value is `Severity[]`, supports disabled, marks touched on blur.

<details>
<summary>Solution</summary>

```ts
@Component({
  selector: 'cx-severity-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SeveritySelectComponent), multi: true }],
  template: `
    <fieldset [disabled]="disabled()" (focusout)="onTouched()">
      <legend>Severity</legend>
      @for (s of all; track s) {
        <label>
          <input type="checkbox" [checked]="value().includes(s)" (change)="toggle(s)" />
          {{ s }}
        </label>
      }
    </fieldset>
  `,
})
export class SeveritySelectComponent implements ControlValueAccessor {
  all: Severity[] = ['debug', 'info', 'warning', 'error', 'critical'];
  value = signal<Severity[]>([]);
  disabled = signal(false);

  private onChange: (v: Severity[]) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(v: Severity[] | null) {
    this.value.set(v ?? []);
  }
  registerOnChange(fn: (v: Severity[]) => void) {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }
  setDisabledState(d: boolean) {
    this.disabled.set(d);
  }

  toggle(s: Severity) {
    const next = this.value().includes(s) ? this.value().filter(x => x !== s) : [...this.value(), s];
    this.value.set(next);
    this.onChange(next);
  }
}
```

Talking points: `writeValue` must not call `onChange` (would mark the form dirty on init); signals make the view update under OnPush; validators can be added by also providing `NG_VALIDATORS`.

</details>

---

## 8. Live tail with batching and pause (35 min)

`TailSocket.connect(query): Observable<LogEntry>` emits up to ~2,000 logs/s. Show newest first, keep at most 2,000 rows, update the UI at most 4×/s, "Pause" button buffers incoming logs and shows "N new", "Resume" flushes them.

<details>
<summary>Solution</summary>

```ts
const MAX_ROWS = 2000;

@Component({
  selector: 'cx-live-tail',
  imports: [ScrollingModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" (click)="paused.set(!paused())">{{ paused() ? 'Resume' : 'Pause' }}</button>
    @if (paused() && pending() > 0) { <span>{{ pending() }} new logs</span> }
    <cdk-virtual-scroll-viewport itemSize="24" class="viewport">
      <div *cdkVirtualFor="let l of rows(); trackBy: trackById" class="row">
        {{ l.timestamp | date: 'HH:mm:ss.SSS' }} {{ l.severity }} {{ l.message }}
      </div>
    </cdk-virtual-scroll-viewport>
  `,
})
export class LiveTailComponent {
  private socket = inject(TailSocket);
  query = input.required<string>();

  paused = signal(false);
  rows = signal<LogEntry[]>([]);
  pending = signal(0);
  private buffer: LogEntry[] = [];

  constructor() {
    toObservable(this.query)
      .pipe(
        switchMap(q => this.socket.connect(q).pipe(bufferTime(250), filter(b => b.length > 0))),
        takeUntilDestroyed(),
      )
      .subscribe(batch => {
        this.buffer.push(...batch);
        if (this.buffer.length > MAX_ROWS) this.buffer.splice(0, this.buffer.length - MAX_ROWS);
        if (this.paused()) this.pending.set(this.buffer.length);
        else this.flush();
      });

    effect(() => {
      if (!this.paused()) untracked(() => this.flush());
    });
  }

  private flush() {
    if (!this.buffer.length) return;
    const incoming = this.buffer.reverse();
    this.buffer = [];
    this.pending.set(0);
    this.rows.update(rows => [...incoming, ...rows].slice(0, MAX_ROWS));
  }

  trackById = (_: number, l: LogEntry) => l.id;
}
```

Talking points: `bufferTime` caps UI updates; the buffer is capped too so a long pause can't exhaust memory; `switchMap` reconnects when the query changes; in a Zone app you'd connect the socket outside Angular; follow-ups: reconnect with backoff and resume cursor, auto-pause when the user scrolls away from the top, server-side sampling when the rate is too high.

</details>
