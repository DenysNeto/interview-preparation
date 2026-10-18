# 10-Day Plan — Coralogix Senior Frontend

Assumption: ~3–4 hours on weekdays, ~5–6 hours on weekends. Day 10 is interview day. If you learn the stage order from the recruiter, move the matching day closer to that stage.

**Daily rhythm**

| Block | Share | What |
| --- | --- | --- |
| Theory | 30% | Read the file for the day, write down answers to the "must-explain" questions in your own words |
| Hands-on | 50% | Code in a real Angular project (`npx @angular/cli@latest new coralogix-playground --style=scss`) |
| Speak | 20% | Explain 3 answers out loud / record a voice note. Fix what sounded vague |

Create the playground on Day 1 and keep adding to it. By Day 6 it should be a mini "Logs Explorer": search bar, time range, histogram, virtualized log table, detail drawer.

---

## Day 1 — Company, domain, Angular foundations

**Goal:** understand what you'd build and get Angular syntax under your fingers.

- [ ] Read [01-company-role-and-domain.md](01-company-role-and-domain.md) (45 min). Sign up for the Coralogix free trial or watch product demos of **Explore, APM, RUM**. Write 5 UX observations (what you like, what you'd improve). These become talking points.
- [ ] [02-angular-for-react-developers.md](02-angular-for-react-developers.md) sections 1–5: standalone components, templates and control flow, inputs/outputs, signals, DI (1.5 h).
- [ ] Hands-on (1.5 h): create the playground. Build `LogRowComponent` (input: log entry, output: `select`), a `LogsService` with mock data via `inject(HttpClient)` or a static array, and a list with `@for (… ; track log.id)`.

## Day 2 — Angular deep: change detection, router, forms, lifecycle

- [ ] [02-angular-for-react-developers.md](02-angular-for-react-developers.md) sections 6–12: change detection, OnPush, zoneless, lifecycle, router, forms, HTTP + interceptors, content projection (1.5 h).
- [ ] Hands-on (2 h):
  - Route `/explore` with lazy `loadComponent`; sync filters to query params.
  - Typed reactive form for a filter bar (`level`, `service`, `text`).
  - Functional HTTP interceptor adding a fake auth header and handling 401.
  - Switch the app to `OnPush` everywhere and see what breaks (mutation bugs).
- [ ] Tricky topics (45 min): the "Change detection", "Signals", and "Components, lifecycle, and templates" groups in [angular/tricky-angular-interview-topics.md](../angular/tricky-angular-interview-topics.md).
- [ ] Say out loud: "Explain Angular change detection, OnPush and zoneless to a React developer."

## Day 3 — RxJS

- [ ] [03-rxjs.md](03-rxjs.md) full (1.5 h).
- [ ] Hands-on (2 h):
  - Typeahead for service names (`debounceTime` → `distinctUntilChanged` → `switchMap` → `catchError`).
  - Polling with pause when tab is hidden + exponential backoff on errors.
  - Convert one stream with `toSignal`, one signal with `toObservable`.
- [ ] Solve tasks 1 and 3 from [09-live-coding-angular.md](09-live-coding-angular.md) under the timer.

## Day 4 — State management + architecture

- [ ] [04-state-management.md](04-state-management.md) (1 h).
- [ ] [13-senior-engineering-essentials.md](13-senior-engineering-essentials.md) sections 0–2 (30 min).
- [ ] [05-architecture-nx-monorepo.md](05-architecture-nx-monorepo.md) (45 min). Run `npx create-nx-workspace@latest` once and generate a `feature`, `ui`, `data-access` lib to see the structure and `nx graph`.
- [ ] Hands-on (1.5 h): move playground state into a signal-based `ExploreStore` (filters, time range, results, loading/error as a discriminated union). Optional: rewrite with NgRx SignalStore.
- [ ] Tricky topics (45 min): the "Dependency injection", "RxJS and HTTP", "Router", "Forms", and "State management" groups in [angular/tricky-angular-interview-topics.md](../angular/tricky-angular-interview-topics.md).
- [ ] Say out loud: "When would you introduce NgRx, and when is a signal service enough?"

## Day 5 (weekend) — Data-intensive UI performance

- [ ] [06-data-intensive-ui-performance.md](06-data-intensive-ui-performance.md) (1.5 h).
- [ ] Refresh [browser-web/performance-and-devtools.md](../browser-web/performance-and-devtools.md) and the rendering part of [browser-web/dom-and-browser.md](../browser-web/dom-and-browser.md) (30 min).
- [ ] Hands-on (3 h):
  - Generate 100k mock logs. Render with CDK virtual scroll. Measure with the Performance panel before/after.
  - Move filtering/aggregation into a Web Worker.
  - Histogram with canvas (or a lib) with brush-to-zoom that updates the time range.
- [ ] Solve tasks 1, 2, 5 from [10-live-coding-data-algorithms.md](10-live-coding-data-algorithms.md).

## Day 6 (weekend) — Frontend system design

- [ ] [07-frontend-system-design.md](07-frontend-system-design.md) (1.5 h).
- [ ] Do two designs **out loud, 40 min each, with a whiteboard (Excalidraw)**: Logs Explorer and Trace waterfall. Compare with the written answers afterwards.
- [ ] Do the Dashboard design in 30 min as a speed round.
- [ ] Solve tasks 3 and 4 from [10-live-coding-data-algorithms.md](10-live-coding-data-algorithms.md).

## Day 7 — Testing + live coding block

- [ ] [08-testing-angular.md](08-testing-angular.md) (1 h).
- [ ] [13-senior-engineering-essentials.md](13-senior-engineering-essentials.md) sections 3–10 (1 h).
- [ ] Write tests for your playground: one component test with a harness or Testing Library, one service test with `HttpTestingController`, one store test.
- [ ] Live coding (2 h, timer, no AI): tasks 2, 4, 6 from [09-live-coding-angular.md](09-live-coding-angular.md).

## Day 8 — Behavioral, leadership, product thinking

- [ ] [11-behavioral-and-leadership.md](11-behavioral-and-leadership.md) (1 h).
- [ ] [13-senior-engineering-essentials.md](13-senior-engineering-essentials.md) sections 11–12 (30 min), then answer the rapid-fire self-check (section 13) out loud.
- [ ] Write **8 STAR stories** using the template (1.5 h). Each ≤ 2 minutes spoken. Must cover: ownership end-to-end, ambiguity, disagreement with product/design, performance win, mentoring, mistake, cross-team work, AI-assisted development.
- [ ] Record yourself answering "Tell me about yourself" (90 s) and "Why Coralogix?" (60 s). Re-record until it sounds natural.
- [ ] Prepare 5 questions for the interviewers.

## Day 9 — Mock day

- [ ] Mock 1 (60 min): one Angular task (choose an unsolved one from file 09) + one data task from file 10. Timer, think aloud.
- [ ] Mock 2 (45 min): system design — "Design RUM session explorer" (not pre-worked in detail, only outlined in file 07).
- [ ] Mock 3 (30 min): behavioral rapid-fire from the question bank in file 11.
- [ ] Ask a friend or an AI to play the interviewer and interrupt with follow-ups ("what if 10M rows?", "what if the backend is slow?", "how do you test this?").
- [ ] Write down weak spots, re-read only those sections. Stop by early evening.

## Day 10 — Interview day

- [ ] Morning: [12-final-day-cheatsheet.md](12-final-day-cheatsheet.md) (20 min).
- [ ] Warm-up: one typeahead in Angular + RxJS from memory (15 min).
- [ ] Re-read your "Tell me about yourself", "Why Coralogix", and questions list.
- [ ] Check setup: camera, mic, IDE ready with a fresh Angular project, StackBlitz as a backup.
- [ ] No new topics.

---

## Progress tracker

| Area | Confidence (1–5) Day 1 | Day 5 | Day 9 |
| --- | --- | --- | --- |
| Angular core (components, DI, templates) | | | |
| Change detection / signals / zoneless | | | |
| RxJS | | | |
| State management (NgRx / signals) | | | |
| Nx / architecture | | | |
| Data-heavy performance | | | |
| System design | | | |
| Testing | | | |
| Observability domain | | | |
| Behavioral stories | | | |
