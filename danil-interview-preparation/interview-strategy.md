# Стратегия live coding (Senior)

Цель интервьюера — увидеть **как ты думаешь**, а не идеальный код с первой попытки. Senior-сигналы важнее скорости.

## Первые 3–5 минут

1. **Прочитай задачу вслух** (или перефразируй).
2. **Уточни требования:**
   - Happy path vs edge cases?
   - Нужна ли persistence / auth / pagination?
   - Ограничения по времени / библиотекам?
   - Input/output форматы, empty states, ошибки сети?
3. **Назови 2–3 edge cases** вслух (пустой список, дубликаты, abort, race, invalid JSON).
4. **Скажи короткий план** (3–5 шагов), потом пиши.

Пример плана:

> «Сначала типы и in-memory store, потом CRUD endpoints, потом Zod validation и error middleware. В конце — smoke test через curl/fetch.»

## Во время кодинга

- **Working minimum first.** Кнопка + state → потом debounce → потом abort.
- **Think aloud.** «Сейчас добавлю AbortController, чтобы отменить предыдущий запрос.»
- **Называй честно.** `items`, `fetchItems`, `errorMessage` лучше, чем `data2`, `tmp`.
- **Типизируй публичный API** (props, request/response, hook return). Внутри можно упрощать.
- **Не молчи больше ~60–90 секунд.** Если думаешь — скажи, о чём думаешь.
- **Trade-offs.** «Можно Context, но для этого скоупа хватит lift state.»

## Если застрял

1. Озвучь, что уже ясно и где блокер.
2. Предложи гипотезу и проверь на маленьком примере.
3. Попроси hint у интервьюера — это нормально.
4. Упрости scope: «Сделаю без persistence, добавлю позже.»

## Последние 5 минут

1. Пройдись по edge cases из начала.
2. Быстрый рефактор (вынести helper, поправить типы).
3. **Саммари:** что сделано, что бы добил с тестами / a11y / perf / observability.

## Senior-сигналы (что ищут)

| Сигнал | Как показать |
| --- | --- |
| Type safety | Discriminated unions для state, generics где уместно |
| Error handling | Не глотать ошибки; понятные status codes / UI states |
| Separation of concerns | UI ≠ fetch ≠ validation ≠ storage |
| Testability | Чистые функции, injectable deps |
| Naming & structure | Маленькие функции, предсказуемые файлы |
| Prod awareness | Abort, race, rate limit, validation, logging |
| Communication | План, trade-offs, follow-ups |

## Антипаттерны

- Сразу писать «идеальную архитектуру» и не успеть до demo.
- Молчать 5 минут.
- Игнорировать типы / `any` везде.
- Не обрабатывать loading / error.
- Спорить с интервьюером вместо диалога.
- Копировать из памяти огромные boilerplate без понимания.

## Чеклист перед «готово»

- [ ] Happy path работает
- [ ] Loading / empty / error states (если UI)
- [ ] Cleanup (effects, timers, abort)
- [ ] Валидация входных данных (если API)
- [ ] Типы на границах
- [ ] Сказано, что бы улучшил дальше
