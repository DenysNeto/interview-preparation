# Mock Interviews

Три timed mock-сессии. Делай в Day 5 (вторник). Можно попросить брата / друга / запись экрана + голоса.

**Правила:**

1. Таймер включён. Нельзя смотреть solutions.
2. Think aloud обязательно.
3. После mock — сразу scoring по рубрике (ниже).
4. Выпиши 3 gaps и закрой их лёгкими задачами / шпаргалкой.

---

## Scoring rubric (0–5 каждая)

| Критерий | 0–1 | 2–3 | 4–5 |
| --- | --- | --- | --- |
| **Correctness** | Не работает happy path | Happy path ок, edge cases дырявые | Работает + основные edge cases |
| **Code quality** | Спагетти / `any` везде | Читаемо, мелкий хаос | Структура, имена, разделение слоёв |
| **Communication** | Молчит | Иногда объясняет | План → код → trade-offs → summary |
| **Edge cases** | Не думал | Назвал, частично сделал | Abort / empty / invalid / errors |
| **TypeScript** | Почти без типов | Базовые типы | Generics / unions / safe parsing |

**Итого max = 25.** Senior target: **≥ 18**.

### Post-task review checklist

- [ ] Что сильнее всего замедлило?
- [ ] Какой API / паттерн забыл?
- [ ] Где бы senior сделал иначе (tests, a11y, errors, structure)?
- [ ] Что повторить завтра утром (разминка)?

---

## Mock A — React UI (60 мин)

**Сценарий:** «Собери searchable list с debounce и обработкой ошибок».

**Задачи (выбери одну основную + одну короткую):**

- Основная (40 мин): [Debounced search](live-coding-tasks/react/02-debounced-search.md) **или** [Autocomplete](live-coding-tasks/react/04-autocomplete.md)
- Короткая (15 мин): [Fix buggy component](live-coding-tasks/react/10-fix-buggy-component.md)
- Buffer (5 мин): summary + scoring

**Interviewer prompts (если соло — задай себе):**

1. Что если пользователь печатает очень быстро?
2. Как отменить устаревший запрос?
3. Как типизируешь ответ API?

**Score:** ___ / 25  
**Gaps:**  

---

## Mock B — Node.js API (60 мин)

**Сценарий:** «Сделай CRUD + защиту от злоупотреблений».

**Задачи:**

- Основная (40 мин): [REST CRUD](live-coding-tasks/nodejs/01-rest-crud.md)
- Добавка (15 мин): [Rate limiter](live-coding-tasks/nodejs/02-rate-limiter.md) **или** кусок [JWT auth](live-coding-tasks/nodejs/03-jwt-auth.md)
- Buffer (5 мин): summary

**Interviewer prompts:**

1. Где валидация и почему Zod на границе?
2. Как обрабатываешь async ошибки в Express?
3. Что изменится при горизонтальном масштабе (rate limit in-memory)?

**Score:** ___ / 25  
**Gaps:**  

---

## Mock C — Next.js / Full-stack (60 мин)

**Сценарий:** «Маленький продукт end-to-end».

**Выбери один трек:**

### Track C1 — Next.js features (если стек явно Next)

- (25 мин) [Server list + client filter](live-coding-tasks/nextjs/01-server-list-client-filter.md)
- (20 мин) [Server Action form](live-coding-tasks/nextjs/04-server-action-form.md) **или** [Route Handler](live-coding-tasks/nextjs/03-route-handler-validation.md)
- (10 мин) Explain: где `'use client'`, зачем `revalidatePath`
- (5 мин) scoring

### Track C2 — Full-stack mini

- (55 мин) [Notes app](live-coding-tasks/full-stack-mini/01-notes-app.md) **или** [URL shortener](live-coding-tasks/full-stack-mini/02-url-shortener.md)
- (5 мин) scoring

**Interviewer prompts:**

1. Почему этот fetch на сервере, а фильтр на клиенте?
2. Как инвалидируешь кэш после мутации?
3. Что бы добавил для production (auth, rate limit, persistence)?

**Score:** ___ / 25  
**Gaps:**  

---

## Рекомендация по Day 5

Сделай **Mock A + Mock B** обязательно. Mock C — если остались силы; иначе пробегись по Next шпаргалке и одной задаче из `nextjs/`.

В день интервью — **не** повторяй полный mock. Только 2 easy warm-ups.
