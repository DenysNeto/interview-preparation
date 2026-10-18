# Frontend Architecture, Nx, and Monorepos

The JD says "drive frontend architecture… scalability, maintainability" and lists Nx as nice-to-have. Expect: "How would you structure a large Angular app owned by many squads?"

---

## 1. What a monorepo gives (and costs)

**Pros:** one version of dependencies, atomic cross-project changes, shared libraries without publishing, consistent tooling, easy refactors, visible dependency graph.

**Cons:** tooling must scale (build/test only what changed, caching), CI can get slow, ownership boundaries must be enforced, one bad upgrade can block everyone.

## 2. Nx essentials

- **Workspace** = apps + libs. Apps are thin shells (routing, bootstrapping); real code lives in libs.
- **Project graph** — Nx analyzes imports to know who depends on whom (`nx graph`).
- **Affected** — `nx affected -t lint test build` runs targets only for projects touched by the diff and their dependents.
- **Computation caching** — task outputs cached locally and remotely (Nx Cloud / self-hosted): re-running an unchanged test is instant, also across CI machines.
- **Task pipeline** — `dependsOn: ['^build']` builds deps first; parallel execution.
- **Generators** — code scaffolding with conventions (`nx g @nx/angular:library`, custom generators for "new feature lib").
- **Module boundary rule** — `@nx/enforce-module-boundaries` ESLint rule with tags.

## 3. Library types (classic Nx guidance)

| Type | Contains | May depend on |
| --- | --- | --- |
| `feature` | Smart components, routes, page logic (e.g. `explore-feature-logs-table`) | ui, data-access, util |
| `ui` | Presentational components, no services with side effects (`shared-ui-time-range-picker`) | ui, util |
| `data-access` | API clients, stores, models | data-access, util |
| `util` | Pure functions, types, formatting (`shared-util-time`) | util |

Plus **scope** tags: `scope:explore`, `scope:apm`, `scope:rum`, `scope:shared`. Rule example: `scope:apm` can depend on `scope:apm` and `scope:shared`, never on `scope:explore`. This prevents squads coupling to each other's internals.

```json
{
  "depConstraints": [
    { "sourceTag": "type:feature", "onlyDependOnLibsWithTags": ["type:feature", "type:ui", "type:data-access", "type:util"] },
    { "sourceTag": "type:ui", "onlyDependOnLibsWithTags": ["type:ui", "type:util"] },
    { "sourceTag": "scope:apm", "onlyDependOnLibsWithTags": ["scope:apm", "scope:shared"] }
  ]
}
```

## 4. Architecture talking points for a large observability app

- **Shared domain primitives** used across Explore/APM/RUM: time range model & picker, query model, severity/colors, chart components, data table, JSON viewer, facet panel. These are the highest-leverage shared libs — invest in their API and performance.
- **Design system** lib with tokens (CSS custom properties), theming (dark mode is mandatory for dev tools), accessible primitives (CDK-based), Storybook for docs and visual tests.
- **Public API per lib** (`index.ts`) — nothing deep-imported. Changing internals doesn't break consumers.
- **Cross-feature navigation via contracts**, not imports: e.g. a `navigateToTrace(traceId)` function in a shared lib, or URL conventions, so APM can link to Explore without importing it.
- **Feature flags** for gradual rollout, kill switches, A/B tests — essential when shipping to production continuously.
- **Lazy loading** each product area (route-level `loadChildren`) and heavy widgets (`@defer`).
- **Error boundaries per widget** so one failing chart doesn't break the dashboard.
- **Telemetry built-in**: performance marks for "time to first result", error reporting, usage analytics → data-driven product decisions (they'll love this, it's their own domain).
- **Contracts with backend**: typed API clients generated from OpenAPI/gRPC/protobuf definitions; runtime validation at boundaries (Zod) for critical payloads; versioning.

## 5. Micro-frontends — know the trade-offs, don't push them

Options: Module Federation / Native Federation, iframes, web components, route-based composition.

- **When useful:** independent deploy cadence for many teams, different frameworks during a migration, very large orgs.
- **Costs:** runtime integration complexity, shared dependency versioning (two Angular versions = pain), duplicated bundles, harder consistent UX, cross-app state/routing.
- **Senior answer:** "In a single-framework product with shared UX I'd prefer a well-bounded Nx monorepo with enforced boundaries and independent lazy-loaded features. I'd reach for federation only if deploy independence is a real bottleneck — and I'd measure first."

## 6. Technical decision-making (how they want you to talk)

When asked about any architecture choice, structure the answer:

1. **Context & constraints** — team size, data volume, deadlines, existing code.
2. **Options** (2–3) with pros/cons.
3. **Decision** and why it fits *this* context.
4. **Risks & mitigation** — how we'd know we were wrong (metrics), how to roll back.
5. **Communication** — RFC/ADR, review with peers, document.

Have one real example ready where you wrote an RFC/ADR or led a technical decision with trade-offs (see [11-behavioral-and-leadership.md](11-behavioral-and-leadership.md)).

## 7. Code review — what you look for (they'll ask, it's in the JD)

1. Does it solve the right problem? Product behavior, edge cases, empty/error/loading states.
2. Correctness: race conditions, leaks (subscriptions), mutation with OnPush, missing `track`.
3. Architecture: right layer (UI vs data-access), boundaries, reuse of shared components.
4. Performance: template method calls, unnecessary re-fetching, bundle size of new deps.
5. Accessibility: keyboard, focus, labels, contrast.
6. Tests: behavior-focused, not implementation details; meaningful coverage of risky logic.
7. Readability & naming.

Tone: ask questions instead of commands, separate blocking from nits ("nit:"), praise good things, automate style issues with lint/format so reviews focus on design.

---

## Must-explain questions

1. How would you organize a monorepo with 3–5 squads working on different products?
2. How does Nx make CI fast? (Affected + caching + distribution.)
3. How do you stop teams from importing each other's internals? (Tags + lint rule + public APIs.)
4. When would you use micro-frontends? When not?
5. How do you introduce a breaking change to a shared component used in 40 places? (Deprecate, codemod/Nx migration generator, feature-flagged rollout, communication.)
