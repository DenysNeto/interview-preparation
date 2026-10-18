# Senior Engineering Essentials

What separates a senior answer from a mid-level one is rarely a fact. It's **judgment**: knowing the options, choosing for the context, naming the trade-off, and connecting the decision to users and the business.

This file is framework-agnostic. Deep dives live elsewhere:

- Angular-specific architecture and Nx → [05-architecture-nx-monorepo.md](05-architecture-nx-monorepo.md)
- Big-data performance → [06-data-intensive-ui-performance.md](06-data-intensive-ui-performance.md)
- System design rounds → [07-frontend-system-design.md](07-frontend-system-design.md)
- Testing in Angular → [08-testing-angular.md](08-testing-angular.md)
- Browser rendering, Web Vitals, DevTools → [browser-web/](../browser-web/README.md)

---

## 0. The senior answer formula

Use this shape for almost any technical question:

1. **Clarify context**: scale, team, constraints, what "good" means here.
2. **Options**: 2–3 realistic approaches.
3. **Decision**: pick one *for this context* and say why.
4. **Trade-off**: what you give up, and when you'd choose differently.
5. **Impact & verification**: how it helps users or the team, and how you'd measure that it worked.

Example: "Should we use NgRx?" → "Depends on how many features share state and how big the team is. For one feature, a signal-based service is simpler. With five squads reacting to the same events, NgRx's conventions and devtools pay off. I'd start simple and set a clear threshold for moving."

Phrases that signal seniority: "it depends on…, and here's how I'd decide", "the risk is…, so I'd mitigate by…", "I'd measure…", "the simplest thing that could work is…".

---

## 1. Architecture principles

### What you should know

| Principle | Frontend meaning |
| --- | --- |
| **Separation of concerns** | UI (presentation) ≠ state/orchestration ≠ data access ≠ domain logic. Pure domain logic (bucketing, parsing, formatting) has no framework imports. |
| **High cohesion, low coupling** | Code that changes together lives together (feature folders). Features talk through small public APIs, not deep imports. |
| **Dependency direction** | Dependencies point inward: feature → data-access → util. Shared UI never imports features. Enforce it with lint rules. |
| **Composition over inheritance** | Small components composed via inputs and content projection; behavior shared via directives, services, or functions instead of base classes. |
| **Single source of truth** | Each piece of state has one owner. Everything else is derived. |
| **Explicit boundaries at the edges** | Validate and map API responses at the boundary into UI models. The rest of the app doesn't care about the backend's shape. |
| **YAGNI / simplest thing first** | Don't build plugin systems or abstractions until there's a second real use case. |
| **Make it easy to delete** | Good architecture lets you remove a feature by deleting a folder and a route. |

### Layers in a typical feature

```
feature/explore
├── pages/            container components: wire store ↔ UI, routing
├── components/       presentational: inputs/outputs only, OnPush
├── state/            store: state shape, derived values, side effects
├── data-access/      API client, DTO ↔ model mapping, caching
└── domain/           pure TS: query parsing, time math, aggregations (100% unit-testable)
```

### Frontend design patterns you'll actually use (be ready with one example each)

| Pattern | Where it shows up |
| --- | --- |
| **Container / Presentational** | Smart page plus dumb, reusable components |
| **Facade** | One service hides store + API details from components (`exploreFacade.search(q)`) |
| **Adapter / Mapper** | Backend DTO → UI model; wrapping a third-party chart library behind your own component API |
| **Strategy** | Different renderers per widget type, or different exporters (CSV, JSON) |
| **Observer** | RxJS, signals, event buses |
| **Command** | Undo/redo in a dashboard editor; a stack of reversible actions |
| **Registry / Plugin** | Widget type → lazy component map |
| **Repository / Cache** | Data layer that decides cache vs network |
| **Strangler fig** | Incremental migration: new code wraps and gradually replaces old code |

### Likely questions

- How would you structure a large frontend so 5 teams can work without stepping on each other?
- How do you decide when to extract a shared component or library? (Rule of thumb: on the second or third real use, and only with a clear owner.)
- How do you keep components reusable without too many configuration inputs? (Composition, content projection or slots, compound components instead of boolean flags.)

---

## 2. API design and frontend–backend contracts

You're on a full-stack product team, so expect API questions.

- **REST vs GraphQL vs gRPC-web**:
  - REST: simple and cacheable, but can over- or under-fetch.
  - GraphQL: flexible, fetches exactly what the UI needs. Costs: caching, complexity, query cost control.
  - gRPC/protobuf: typed contracts and efficiency; needs a proxy in the browser.
- **BFF (Backend for Frontend)**: a thin layer that shapes data for the UI, aggregates calls, and handles auth. Use it when the UI needs many calls or heavy reshaping.
- **Contract-first**: an OpenAPI or protobuf schema → generated TS types and clients. No hand-written types drifting from the backend.
- **Runtime validation** at critical boundaries (Zod), because TypeScript disappears at runtime ([typescript.md](../typescript/typescript.md)).
- **Pagination**: cursor-based for changing data (logs), offset only for small, static lists.
- **Error model**: a consistent shape (`{ code, message, details, traceId }`); distinguish user-fixable errors (syntax error at a position) from system errors (timeout, 5xx); support partial results.
- **Versioning and backward compatibility**: additive changes only. The frontend must tolerate unknown fields and new enum values. Deploy order matters: backend first, then frontend.
- **Idempotency** for retries on mutations (idempotency keys).
- **Long-running queries**: async job + polling, or streaming (SSE/WebSocket), plus cancellation.

Likely question: "Backend gives you an endpoint returning 50 MB of JSON. What do you do?" → Talk to them first: pagination, projection, server-side aggregation, compression, streaming NDJSON. On the client: workers, progressive rendering.

---

## 3. Performance: the senior mindset

You know the techniques (see [06](06-data-intensive-ui-performance.md) and [performance-and-devtools.md](../browser-web/performance-and-devtools.md)). Senior is about **process**:

1. **Define what matters**: user-centric metrics (INP on interactions, time-to-first-result for queries, LCP for entry pages), not "the app feels slow".
2. **Measure in production** (RUM, field data) and in the lab (DevTools, Lighthouse). Lab data alone lies; the user's device and data volume are different.
3. **Find the bottleneck** before optimizing: network, parse, framework, DOM, or memory.
4. **Fix the biggest win first**, often architectural (less data, server-side aggregation) rather than micro-optimizations.
5. **Prevent regressions**: performance budgets in CI (bundle size, Lighthouse CI), dashboards, alerts on RUM metrics.

### Performance levers by layer (the checklist to rattle off)

| Layer | Levers |
| --- | --- |
| **Delivery** | Code splitting per route, lazy/deferred components, tree-shaking, modern build output, compression (brotli), CDN, HTTP caching with hashed filenames, preload critical resources |
| **Data** | Fetch less (projection, pagination), aggregate server-side, cache (memory, HTTP, SWR), dedupe, cancel, prefetch on intent (hover) |
| **Compute** | Memoization (computed, pure pipes), workers, chunking long tasks, efficient algorithms (Map instead of `array.find` in loops) |
| **Rendering** | Fewer DOM nodes (virtualization), avoid layout thrashing, CSS containment (`contain`, `content-visibility`), compositor-only animations (`transform`, `opacity`), canvas for heavy charts |
| **Framework** | OnPush/signals, `track`, avoid unnecessary change detection, zoneless |
| **Memory** | Cap buffers, clean up subscriptions/observers, avoid retaining large closures |
| **Perceived** | Skeletons, optimistic UI, progressive results, keep previous data visible |

### Bundle-size questions

- How do you find what makes the bundle big? Source-map explorer / build stats, check for duplicate dependencies, and import cost.
- How do you stop it growing? Budgets in CI, review new dependencies (size, maintenance, license), lazy-load heavy libraries (charts, editors like Monaco).

---

## 4. Testing strategy (senior framing)

Full details: [08-testing-angular.md](08-testing-angular.md). What you must be able to *say*:

- **Goal**: confidence to ship fast, not coverage numbers. Coverage is a smell detector, not a target.
- **Shape**: the testing trophy:
  - static analysis (strict TypeScript, ESLint) as the base;
  - many unit tests for pure logic;
  - most UI value from integration-style component tests;
  - few E2E tests for critical journeys.
- **Test behavior, not implementation**: query by role and text, interact like a user, assert visible results. Tests survive refactors.
- **Determinism**: fake timers, mocked network at the boundary, no real dates (inject `now`), no order dependence. **Flaky tests are bugs**: quarantine, fix, and track flakiness.
- **Contract tests** between frontend and backend (generated types, consumer-driven contracts) catch breaking API changes before production.
- **Visual regression** for the design system and charts.
- **Accessibility testing**: axe in component/E2E tests plus manual keyboard checks.
- **Performance tests**: bundle budgets, Lighthouse CI, interaction benchmarks for hot paths.
- **Testing in production**: feature flags, canary releases, monitoring, and fast rollback are part of the strategy. You can't test every real-world data shape in CI.
- **What not to test**: framework internals, trivial getters, third-party libraries.

Likely question: "Your team's E2E suite takes 40 minutes and is flaky. What do you do?" → Measure flakiness per test, quarantine the worst, push coverage down to component and integration tests, parallelize/shard, run only affected tests on PRs and the full suite nightly, use stable selectors (roles/test ids), mock unstable third parties.

---

## 5. Reliability and error handling

- **Every async UI has 4+ states**: idle, loading, success (including empty), error. Partial results is a fifth in observability.
- **Error boundaries per region/widget**: one broken chart shouldn't blank the page.
- **Retries** only for idempotent requests and transient errors (network, 503), with exponential backoff + jitter and a cap. Never auto-retry 4xx.
- **Timeouts and cancellation** everywhere: stale requests waste backend money and create race conditions.
- **Graceful degradation**: if facets fail, results still show; if live tail disconnects, show status and reconnect.
- **Global error handler** sends to monitoring with context (route, user action, traceId, app version).
- **Offline/flaky network**: detect it, queue or disable mutations, inform the user.

---

## 6. Security (frontend scope)

Details: [storage-auth-security.md](../browser-web/storage-auth-security.md). Senior checklist:

- **XSS**: never render untrusted HTML. Log content in an observability tool is untrusted user input! Frameworks escape interpolation; bypassing the sanitizer is a review red flag. Add a **CSP** as defense in depth.
- **Auth tokens**: prefer HttpOnly secure cookies over localStorage (XSS can read localStorage); CSRF protection with SameSite + tokens.
- **Authorization is the backend's job**: the UI only hides things for UX. Never trust the client.
- **Multi-tenant SaaS**: make sure caches (in-memory, service worker) are keyed per tenant/user and cleared on logout or account switch.
- **Secrets**: never in the frontend bundle or URLs (URLs end up in logs and referrers).
- **Dependencies**: supply-chain risk. Use lockfiles, automated audits (Dependabot/Renovate), and review new packages.
- **PII**: masking in session replay and logs (relevant for RUM).

---

## 7. Accessibility at scale

Details: [html-css-accessibility.md](../html-css-accessibility/html-css-accessibility.md).

- Build it into the **design system**: accessible primitives (buttons, menus, dialogs, comboboxes, grids) so product teams get a11y by default.
- Know the **ARIA patterns** for complex widgets in data tools: grid/treegrid (tables, trace tree), combobox (query autocomplete), tree (JSON viewer), dialog/drawer (focus trap, restore focus), live regions (announcing "123 results").
- **Keyboard first** for power users: shortcuts, roving tabindex in tables, visible focus.
- **Color**: severity must not rely on color alone; contrast in dark theme; colorblind-safe chart palettes.
- Automated checks catch ~30–40% of issues; the rest needs manual testing.

---

## 8. Design systems and UI consistency

- **Tokens** (color, spacing, typography, elevation) as CSS custom properties make theming (dark mode) easy.
- **Component API design**: small, composable, consistent naming; avoid huge config objects; document with Storybook; version and deprecate carefully.
- **Ownership**: a dedicated team or a guild model; contribution guidelines.
- **Adoption**: lint rules or codemods to migrate, track usage, remove legacy components.
- Trade-off: consistency and speed vs flexibility for product teams. Provide escape hatches deliberately.

---

## 9. Delivery: CI/CD, releases, feature flags

- **Trunk-based development** with short-lived branches and small PRs, plus feature flags to merge unfinished work safely.
- **CI pipeline**: lint → type-check → unit/component tests → build → E2E on affected projects; caching (Nx) keeps it fast.
- **Preview environments** per PR for design/product review.
- **Release strategies**: canary, percentage rollouts, internal dogfooding first, quick rollback (immutable builds plus version switch).
- **Feature flags**: release toggles (temporary, delete them!), ops kill switches, experiments, permission flags. Flag debt is real; track and remove old flags.
- **Cache busting** for SPAs: hashed assets; handle users with an old tab open after a deploy (chunk load errors → prompt reload).
- **Source maps** uploaded to monitoring, not served publicly (or served deliberately).

---

## 10. Observability of your own frontend

Fitting for Coralogix; they will like this.

- **RUM**: Web Vitals, errors, slow interactions per route and per app version.
- **Custom metrics**: `performance.mark/measure` for domain moments like "query submitted → first row rendered".
- **Structured logging** with context; correlate frontend requests with backend traces (`traceparent` header).
- **Product analytics**: feature adoption, funnels (did users find the new facet panel?). Measure product decisions, not just technical health.
- **Alerting** on regressions after deploys (error rate, INP p75).

---

## 11. Technical decisions, debt, and migrations

### Decision making

- Write an **RFC** for big or controversial changes (problem, options, recommendation, risks, rollout). Write an **ADR** to record the decision and why.
- Prototype or spike when uncertainty is high; time-box it.
- Reversible decisions → decide fast. Irreversible ones (public APIs, data formats, framework choice) → slow down and involve more people.
- Disagree and commit: argue with data, then support the team's decision.

### Tech debt

- Make it **visible**: a list with impact (bugs, slowness, onboarding cost), not complaints.
- Tie it to business value: "This refactor makes feature X 2× faster to build" or "it removes the class of bugs behind 30% of incidents".
- Strategies: boy-scout rule in daily work, a fixed percentage of sprint capacity, or a focused project when the cost is high.

### Migrations (likely topic: NgModules → standalone, Zone → zoneless, RxJS → signals, AngularJS/legacy → modern)

- **Incremental, never big-bang**: strangler fig, migrate per feature/route.
- Automate with schematics and codemods, enforce the new pattern with lint rules ("no new NgModules").
- Keep both worlds working (interop: `toSignal`/`toObservable`).
- Feature-flag risky parts, monitor errors and performance, have a rollback.
- Communicate: a migration guide, office hours, track progress with a visible metric.

---

## 12. Leadership without a title

The JD asks you to "raise the bar". Be ready with concrete examples:

- **Code review**: what you look for, tone, blocking vs non-blocking comments, fast turnaround ([05 §7](05-architecture-nx-monorepo.md)).
- **Mentoring**: pairing, giving juniors ownership of scoped features with support, explaining the "why" in reviews, growth plans.
- **Raising standards**: lint rules, templates, generators, docs, testing guidelines, and automating what reviews keep repeating.
- **Cross-functional influence**: involve design early about data realities (what real logs look like), push back with alternatives instead of a plain "no", explain technical constraints in product language.
- **Estimation and planning**: break work into vertical slices, flag unknowns, give ranges with confidence, re-plan early when reality changes.
- **Incidents**: stay calm, mitigate first (rollback/flag off), communicate, then run a blameless postmortem with concrete action items.
- **Ambiguity**: turn vague goals into a problem statement, success metrics, and a first small deliverable; validate with users early.

---

## 13. Rapid-fire self-check (answer each out loud in under 1 minute)

1. How do you structure a large frontend app, and how do you enforce boundaries?
2. Where should state live? Give 4 categories.
3. A page is slow. What's your process?
4. How do you stop performance regressions over time?
5. What's your testing strategy, and what don't you test?
6. How do you deal with flaky tests?
7. How do you handle errors and retries in the UI?
8. Top 3 frontend security risks in a log viewer?
9. How do you introduce a breaking change to a shared component?
10. How do you release a risky feature safely?
11. How do you decide between building in-house and adopting a library?
12. How do you argue for paying down tech debt?
13. How would you migrate a large app to a new pattern without stopping feature work?
14. How do you make a complex data UI accessible?
15. What do you look for in a code review?
16. How do you mentor a mid-level engineer toward senior?
17. How do you handle a disagreement with Product about scope?
18. How would you measure whether a new feature succeeded?

If any answer takes more than a minute or lacks a trade-off, re-read the matching section.
