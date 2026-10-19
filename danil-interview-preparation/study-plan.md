# План на 5 дней (4–5 часов/день)

**Цель:** уверенно писать TypeScript-код в React / Node.js / Next.js под давлением, проговаривая решения.

**Ритм каждого дня (~4.5 ч):**

| Блок | Время | Что делать |
| --- | --- | --- |
| Theory refresh | 45 мин | Чеклист + шпаргалка + ссылки из репо |
| Timed tasks | 2.5 ч | 2–4 задачи под таймер, без AI |
| Review mistakes | 45 мин | Сверить с solution, выписать gaps |
| Think aloud | 30 мин | Пересказать решение вслух / записать voice note |

---

## Day 1 — Пятница: React core + hooks

**Цель дня:** чистые компоненты, корректный cleanup эффектов, stale closures.

### Theory (45 мин)

- [cheatsheets/react-ts-cheatsheet.md](cheatsheets/react-ts-cheatsheet.md)
- Из репо: [tricky-react-interview-answers.ru.md](../react/tricky-react-interview-answers.ru.md) — batching, effects, stale closures, keys, memoization

### Tasks (2.5 ч) — из `live-coding-tasks/react/`

| # | Задача | Time box |
| --- | --- | --- |
| 1 | [01-todo-list.md](live-coding-tasks/react/01-todo-list.md) | 25 мин |
| 2 | [02-debounced-search.md](live-coding-tasks/react/02-debounced-search.md) | 30 мин |
| 3 | [03-use-fetch.md](live-coding-tasks/react/03-use-fetch.md) | 35 мин |
| 4 | [09-form-validation.md](live-coding-tasks/react/09-form-validation.md) (часть) | 30 мин |

Бонус если есть время: `useDebounce` / `usePrevious` внутри задач 2–3.

### Review + think aloud (1.25 ч)

Checklist: AbortController? race conditions? deps массивы? controlled inputs?

---

## Day 2 — Суббота: React advanced UI + TypeScript

**Цель дня:** API компонентов, a11y basics, generics / unions.

### Theory (45 мин)

- [typescript/typescript.md](../typescript/typescript.md) — generics, discriminated unions, utility types
- В шпаргалке React: portals, focus trap, compound components

### Tasks (2.5 ч)

| # | Задача | Time box |
| --- | --- | --- |
| 1 | [04-autocomplete.md](live-coding-tasks/react/04-autocomplete.md) | 35 мин |
| 2 | [05-infinite-scroll.md](live-coding-tasks/react/05-infinite-scroll.md) | 30 мин |
| 3 | [06-accessible-modal.md](live-coding-tasks/react/06-accessible-modal.md) | 30 мин |
| 4 | [07-tabs-accordion.md](live-coding-tasks/react/07-tabs-accordion.md) **или** [08-shopping-cart.md](live-coding-tasks/react/08-shopping-cart.md) | 30 мин |

Если останется время: [10-fix-buggy-component.md](live-coding-tasks/react/10-fix-buggy-component.md) (15 мин).

### Review focus

Keys, keyboard nav, `role`/`aria-*`, `useReducer` shape, generic props.

---

## Day 3 — Воскресенье: Node.js + API

**Цель дня:** за 20–30 мин собрать структурированный Express API (routes → service → validation → errors).

### Theory (45 мин)

- [cheatsheets/nodejs-express-cheatsheet.md](cheatsheets/nodejs-express-cheatsheet.md)
- Event loop, middleware chain, JWT vs sessions, Zod validation
- Из репо: [async-js](../async-js/asynchronous-javascript.md)

### Tasks (2.5 ч)

| # | Задача | Time box |
| --- | --- | --- |
| 1 | [01-rest-crud.md](live-coding-tasks/nodejs/01-rest-crud.md) | 35 мин |
| 2 | [02-rate-limiter.md](live-coding-tasks/nodejs/02-rate-limiter.md) | 25 мин |
| 3 | [03-jwt-auth.md](live-coding-tasks/nodejs/03-jwt-auth.md) | 30 мин |
| 4 | [04-pagination-filter.md](live-coding-tasks/nodejs/04-pagination-filter.md) **или** [06-promise-pool-retry.md](live-coding-tasks/nodejs/06-promise-pool-retry.md) | 30 мин |

Домашнее (если сила есть): [05-ttl-cache.md](live-coding-tasks/nodejs/05-ttl-cache.md), [07-stream-csv.md](live-coding-tasks/nodejs/07-stream-csv.md), [08-job-queue.md](live-coding-tasks/nodejs/08-job-queue.md).

### Review focus

Error middleware, status codes, async error wrapping, separation of concerns.

---

## Day 4 — Понедельник: Next.js App Router

**Цель дня:** чётко знать, где `'use client'`, как работают RSC, Route Handlers, Server Actions, middleware.

### Theory (45 мин)

- [cheatsheets/nextjs-app-router-cheatsheet.md](cheatsheets/nextjs-app-router-cheatsheet.md)
- [cheatsheets/nextjs-ssr-hydration.ru.md](cheatsheets/nextjs-ssr-hydration.ru.md) — SSR, гидратация, кэш, Server Actions, middleware, layout. Проговорить вслух раздел «Прогон»
- SSG / SSR / ISR, `loading.tsx` / `error.tsx`, caching basics

### Tasks (2.5 ч)

| # | Задача | Time box |
| --- | --- | --- |
| 1 | [01-server-list-client-filter.md](live-coding-tasks/nextjs/01-server-list-client-filter.md) | 25 мин |
| 2 | [02-dynamic-route-metadata.md](live-coding-tasks/nextjs/02-dynamic-route-metadata.md) | 20 мин |
| 3 | [03-route-handler-validation.md](live-coding-tasks/nextjs/03-route-handler-validation.md) | 25 мин |
| 4 | [04-server-action-form.md](live-coding-tasks/nextjs/04-server-action-form.md) | 30 мин |
| 5 | [05-auth-middleware.md](live-coding-tasks/nextjs/05-auth-middleware.md) **или** [06-suspense-streaming.md](live-coding-tasks/nextjs/06-suspense-streaming.md) | 25 мин |

### Review focus

Что можно импортировать в Server Component, где fetch кэшируется, `revalidatePath` vs tags.

---

## Day 5 — Вторник: JS/TS utils + full-stack mini + mocks

**Цель дня:** утилиты на автомате + один full-stack кусок + 2 mock-сессии.

### Theory (30 мин)

Быстрый проход шпаргалок + [async-js](../async-js/asynchronous-javascript.md).

### Tasks (2 ч)

| # | Задача | Time box |
| --- | --- | --- |
| 1–4 | Utils: debounce, throttle, promisePool, LRU — из [js-ts-utilities/](live-coding-tasks/js-ts-utilities/) | по 15–20 мин |
| 5 | Один full-stack mini: [01-notes-app.md](live-coding-tasks/full-stack-mini/01-notes-app.md) или [02-url-shortener.md](live-coding-tasks/full-stack-mini/02-url-shortener.md) | 60 мин |

### Mocks (2 ч)

См. [mock-interviews.md](mock-interviews.md): Mock A (React) + Mock B (Node **или** full-stack). После каждого — scoring rubric.

---

## День интервью (среда) — только 30 мин

1. Перечитай [interview-strategy.md](interview-strategy.md) (10 мин).
2. Две лёгкие разминки: например todo toggle + `debounce` (15 мин).
3. Вода, дыхание, никаких новых тем (5 мин).

**Не делай:** новые алгоритмы, глубокий Next.js caching, длинный YouTube.

---

## Трекер прогресса

Отмечай в [live-coding-tasks/README.md](live-coding-tasks/README.md) чекбоксами. Цель: **≥ 25 / 37** задач решены самостоятельно до среды.
