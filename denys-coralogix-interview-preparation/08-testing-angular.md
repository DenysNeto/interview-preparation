# Testing in Angular (Senior Level)

JD: "Write clean, well-tested, production-ready code." Expect "What's your testing strategy?" and possibly writing a test in live coding.

---

## 1. Strategy answer (say this shape)

> "I test behavior at the cheapest level that gives confidence. Pure logic — URL parsing, query building, bucketing, span tree — gets fast unit tests with many edge cases. Components get tests through their public surface: inputs, outputs, DOM and user interactions, not private methods. Services get tests with `HttpTestingController`. A handful of Playwright E2E tests cover critical journeys like 'search → open log → jump to trace'. Visual regression for the design system and charts. And everything runs on affected projects in CI so it stays fast."

Testing trophy over pyramid: most value from integration-style component tests; E2E for critical paths only (slow, flaky if overused).

## 2. Tooling landscape

- **Runner**: Karma/Jasmine is deprecated. Modern projects use **Jest** or **Vitest** (Vitest is the default for new CLI projects in the latest Angular versions). Nx supports both.
- **Angular Testing Library** — `render(Component, { inputs })`, `screen.getByRole`, `userEvent`. Same philosophy as React Testing Library — easy transfer for you.
- **CDK Component Harnesses** — stable API to interact with Material/CDK components (`MatSelectHarness`) and your own design system components.
- **E2E**: Playwright (or Cypress). Component testing in Playwright/Cypress is also an option.
- **Mocking HTTP**: `provideHttpClientTesting()` + `HttpTestingController`; MSW for higher-level tests.

## 3. Component test with Angular Testing Library

```ts
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

it('emits selected log id on row click', async () => {
  const selected = vi.fn();
  await render(LogRowComponent, {
    inputs: { log: { id: '1', timestamp: 0, severity: 'error', service: 'api', message: 'boom' } },
    on: { selected },
  });

  await userEvent.click(screen.getByText('boom'));

  expect(selected).toHaveBeenCalledWith('1');
});
```

## 4. TestBed basics (still needed for many codebases)

```ts
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [ExplorePage],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: FeatureFlags, useValue: { isEnabled: () => true } },
    ],
  });
});

it('renders logs from the API', async () => {
  const fixture = TestBed.createComponent(ExplorePage);
  const http = TestBed.inject(HttpTestingController);
  fixture.detectChanges();

  http.expectOne(r => r.url.endsWith('/logs/search')).flush({ items: [fakeLog] });
  await fixture.whenStable();

  expect(fixture.nativeElement.textContent).toContain(fakeLog.message);
  http.verify();
});
```

- `fixture.componentRef.setInput('log', value)` to set signal inputs.
- `fixture.detectChanges()` vs `await fixture.whenStable()` (zoneless tests rely on `whenStable`).
- `overrideComponent` / `overrideProvider` to swap dependencies.

## 5. Testing services, stores, signals

```ts
it('toggles severity filter', () => {
  TestBed.configureTestingModule({ providers: [ExploreStore, { provide: LogsApi, useValue: fakeApi }] });
  const store = TestBed.inject(ExploreStore);

  store.toggleSeverity('error');
  expect(store.filters().severities).toEqual(['error']);

  store.toggleSeverity('error');
  expect(store.filters().severities).toEqual([]);
});
```

- Signals are synchronous → read them directly. Effects run during change detection → `TestBed.flushEffects()` / `TestBed.tick()` (name depends on version).
- Time-based RxJS: `fakeAsync` + `tick(ms)` or fake timers; marble tests for complex streams (see [03-rxjs.md](03-rxjs.md)).

## 6. What to test in an observability UI (concrete examples to mention)

- Time range parsing (`now-15m`), timezone/DST edges, bucket boundaries.
- URL serialize → parse round trip (property-based testing with fast-check is a nice senior touch).
- Query builder escaping (`service:"api gateway"`).
- Span tree with orphans, cycles, clock skew.
- Race: second search response arrives before first → UI shows second.
- Empty, error, partial-results states.
- Accessibility: role-based queries already enforce it; plus axe checks in E2E.

## 7. Anti-patterns to call out in review

- Testing private methods or implementation details (`component['internalState']`).
- Snapshot tests of large DOM — brittle, nobody reads diffs.
- Real timers / real network in unit tests → flaky.
- Over-mocking so the test only tests mocks.
- E2E tests for every edge case.
- `setTimeout` waits in tests instead of awaiting conditions.

## 8. Quality beyond tests

- Strict TypeScript, ESLint (+ `@angular-eslint`), Prettier, module boundary rules.
- Storybook for UI libs + visual regression (Chromatic/Playwright screenshots).
- Contract types generated from backend schema.
- Feature flags + monitoring + quick rollback = safety net in production.
- Performance budgets in CI (bundle size, Lighthouse CI for key pages).
