# Denys — Coralogix Senior Frontend Engineer Prep

Role: **Senior Frontend Engineer**, squad owning **Explore, APM, RUM** UIs. Stack: **Angular + TypeScript**, Nx monorepo, data-intensive UIs, full-stack product ownership, AI-assisted development.

Timeline: **10 days**. Start with [study-plan-10-days.md](study-plan-10-days.md).

## What is in this folder

This folder only covers what the rest of the repo does **not** already cover. JS fundamentals, async, TypeScript basics, React, browser, HTML/CSS/a11y live elsewhere — links below.

| File | Why you need it |
| --- | --- |
| [study-plan-10-days.md](study-plan-10-days.md) | Day-by-day plan with time boxes |
| [01-company-role-and-domain.md](01-company-role-and-domain.md) | Coralogix, observability domain (logs/metrics/traces, APM, RUM), what the squad builds, JD → talking points |
| [02-angular-for-react-developers.md](02-angular-for-react-developers.md) | Modern Angular (standalone, signals, DI, change detection, zoneless, control flow, router, forms) mapped to React concepts |
| [03-rxjs.md](03-rxjs.md) | RxJS mental model, flattening operators, subjects, leaks, interop with signals |
| [04-state-management.md](04-state-management.md) | Signals-in-services, NgRx Store / Effects / SignalStore, URL as state, server cache |
| [05-architecture-nx-monorepo.md](05-architecture-nx-monorepo.md) | Nx, library types, module boundaries, design system, micro-frontends trade-offs |
| [06-data-intensive-ui-performance.md](06-data-intensive-ui-performance.md) | Virtual scroll, huge tables, charts (canvas vs SVG), web workers, streaming, Angular-specific perf |
| [07-frontend-system-design.md](07-frontend-system-design.md) | RADIO framework + 4 worked designs: Logs Explorer, Trace waterfall, Dashboards, RUM session view |
| [08-testing-angular.md](08-testing-angular.md) | TestBed, harnesses, testing signals/RxJS, Playwright, what to test as a senior |
| [09-live-coding-angular.md](09-live-coding-angular.md) | Angular live-coding tasks in an observability flavor, with solutions |
| [10-live-coding-data-algorithms.md](10-live-coding-data-algorithms.md) | Pure TS data tasks: histogram buckets, span tree, query parser, percentiles, downsampling |
| [11-behavioral-and-leadership.md](11-behavioral-and-leadership.md) | STAR story bank mapped to the JD, senior/leadership questions, AI-assisted dev, questions to ask |
| [12-final-day-cheatsheet.md](12-final-day-cheatsheet.md) | One-page review for the evening before / morning of |
| [13-senior-engineering-essentials.md](13-senior-engineering-essentials.md) | Framework-agnostic senior topics: architecture principles and patterns, API contracts, performance process, testing strategy, reliability, security, a11y, design systems, CI/CD and flags, tech debt and migrations, leadership; rapid-fire self-check |

## Reuse from the repo (do not re-learn, just refresh)

| Topic | File |
| --- | --- |
| JS fundamentals | [general-js/javascript-language-fundamentals.md](../general-js/javascript-language-fundamentals.md) |
| Event loop, promises, async | [async-js/asynchronous-javascript.md](../async-js/asynchronous-javascript.md) |
| TypeScript | [typescript/typescript.md](../typescript/typescript.md) |
| Browser rendering, DOM, events | [browser-web/dom-and-browser.md](../browser-web/dom-and-browser.md) |
| Core Web Vitals, DevTools, memory leaks | [browser-web/performance-and-devtools.md](../browser-web/performance-and-devtools.md) |
| Networking, browser APIs | [browser-web/networking-and-browser-apis.md](../browser-web/networking-and-browser-apis.md) |
| Storage, auth, security (XSS, CSRF, CSP) | [browser-web/storage-auth-security.md](../browser-web/storage-auth-security.md) |
| HTML, CSS, accessibility | [html-css-accessibility/html-css-accessibility.md](../html-css-accessibility/html-css-accessibility.md) |
| Angular Q&A and 60 tricky topics with examples | [angular/angular.md](../angular/angular.md), [angular/tricky-angular-interview-answers.md](../angular/tricky-angular-interview-answers.md) |
| React (for comparison answers) | [react/react.md](../react/react.md), [react/tricky-react-interview-answers.md](../react/tricky-react-interview-answers.md) |
| Live-coding behaviour and senior signals | [danil-interview-preparation/interview-strategy.md](../danil-interview-preparation/interview-strategy.md) |
| JS utilities (debounce, LRU, promise pool…) | [danil-interview-preparation/live-coding-tasks/js-ts-utilities/](../danil-interview-preparation/live-coding-tasks/js-ts-utilities/) |

## Rules for the 10 days

- **Angular is the main gap.** Days 1–4 are heavy on Angular and RxJS. Build a small Angular app by hand; reading alone is not enough.
- Practise live coding **with a timer and without AI autocomplete**. You will be allowed AI at work, but probably not in the interview.
- Speak out loud while solving. Coralogix explicitly looks for communication and product thinking.
- Every technical answer should end with a **trade-off** and a **product/user impact** sentence. That is the senior signal for this role.
- Ask the recruiter early what the stages are (typically: HR screen → technical/live coding → system design → team lead/manager → culture/VP). Re-weight the plan once you know.
