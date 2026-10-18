# TypeScript: подробные ответы

Короткие устные ответы на шесть тем. Говори абзац. Буллеты — только если задали уточнение.

Копия на английском: [typescript-deep-topics.md](typescript-deep-topics.md). Короткий чеклист по остальному языку: [typescript.md](typescript.md).

Термины TypeScript оставлены на английском (`interface`, `narrowing`, `Promise`, `Pick`): так их обычно и произносят.

---

## 1. `type` vs `interface`

И то и другое задаёт форму, а TypeScript проверяет её структурно: важны поля, а не имя. `interface` — для контракта объекта или класса, который другие могут расширить через `extends` или дополнить. `type` — для union, tuple, mapped или conditional type, примитива, или просто имени уже существующего типа. Начинай с `interface` и переходи на `type`, когда интерфейс этого не умеет.

```ts
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

interface User {
  id: string;
  name: string;
}
```

- Сливается только `interface`. Два `interface User` в одной области видимости склеиваются. Второй `type User` — ошибка. Модули между собой не сливаются; `declare module` и `declare global` — сливаются.
- `interface` расширяют через `extends`, `type` пересекают через `&`. Для объектных контрактов лучше `extends`. Длинная цепочка `&` проверяется медленнее и даёт хуже ошибки.
- Интерфейс не может быть union и не может сделать `extends` от union. Сам union — это `type`: `type Shape = Circle | Rect`.
- Класс может `implement` и то и другое. `implements` проверяет форму и не копирует поведение. Исключение — private и `#`: они делают класс номинальным.
- Для пропсов бери `type`, если тип собран через `Omit` или `ComponentProps`. `interface` — для стабильного публичного контракта компонента.

---

## 2. Асинхронность в TypeScript

Асинхронность в TypeScript — это обычные `Promise` и `async/await` из JavaScript, к которым TypeScript добавляет типы. `async`-функция всегда возвращает `Promise<T>`, где `T` — то, что она возвращает через `return`. `await` превращает `Promise<T>` в `T`. Главное: тип описывает только успешный результат. Ошибки в тип не попадают, поэтому в `catch` переменная имеет тип `unknown`.

```ts
async function getUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

try {
  const user = await getUser("1"); // User
} catch (error) {
  // error: unknown
  const message = error instanceof Error ? error.message : String(error);
}
```

- **Возвращаемый тип.** У публичных функций пишу `Promise<User>` явно. Если функция ничего не возвращает — `Promise<void>`.
- **Параллельные запросы.** `Promise.all` сохраняет тип каждого элемента: `const [user, posts] = await Promise.all([getUser(id), getPosts(id)])` даёт `User` и `Post[]`. `Promise.allSettled` возвращает `{ status: "fulfilled"; value } | { status: "rejected"; reason }`, и я сужаю по `status`.
- **Ошибки.** Тип ошибки нигде не описан, поэтому `catch (error)` — это `unknown`. Сужаю через `instanceof Error`. Если ошибка — нормальный исход (не найдено, не прошла валидация), возвращаю `{ ok: true; data } | { ok: false; error }` вместо `throw`. Тогда вызывающий обязан обработать обе ветки.
- **Данные из API.** `res.json()` возвращает `any`, а `as User` ничего не проверяет. Для данных извне — валидация (Zod) или type guard.
- **`Awaited<T>`.** Достаёт тип из промиса: `Awaited<ReturnType<typeof getUser>>` — это `User`.
- **Частая ошибка.** `async`-функцию можно передать туда, где ждут `() => void` (`onClick`, `forEach`). Промис никто не ждёт, и ошибка теряется. `forEach(async ...)` не ждёт итераций: последовательно — `for...of` с `await`, параллельно — `Promise.all`.

---

## 3. Типизация React и Node

Типизируй границу. Пропсы, события, рефы, состояние хуков и контекст рождаются в типизированном коде, и компилятор их проверяет. `req.body`, `JSON.parse`, `fetch` и `process.env` не проверены, пока это не сделает рантайм.

```tsx
type ButtonProps = {
  variant?: "primary" | "ghost";
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};
```

- `ReactNode` — всё, что можно отрендерить. `ReactElement` — один элемент. С `@types/react` 18 `FC` не добавляет `children`.
- Читай `event.currentTarget`, не `target`. `currentTarget` — элемент, на котором висит обработчик.
- DOM-пропсы бери из `ComponentPropsWithoutRef<"button">` и `Omit`-и ключи, которые заменяешь. Без `Omit` несовместимые обработчики схлопываются в `never`.
- Типы рефов зависят от `@types/react`. В React 18 у `useRef(null)` поле `current` только для чтения. В React 19 `ref` — обычный проп, а `useRef` изменяемый и требует начальное значение.
- `useState(null)` выводит `null`. `useState([])` выводит `never[]`. Передай аргумент типа.
- Контекст типизируй как `createContext<User | undefined>(undefined)` и бросай ошибку в хуке, если его вызвали вне провайдера.
- Дженерик-компонент нужен, когда `T` связывает `items` и `renderItem`. Полиморфный `as` — это `ElementType` плюс `Omit<ComponentPropsWithoutRef<E>, свои ключи>`.
- В Node ставь `"module": "nodenext"` и `verbatimModuleSyntax`. `process.env[name]` — это `string | undefined`; разбери окружение один раз на старте. Дженерик Express JSON не разбирает. Провалидируй, потом локально расширь `Request`. `namespace Express` дополняй, только если поле нужно каждому запросу.

---

## 4. Generics

Дженерик — это заполнитель, который подставляет вызывающий код, и TypeScript обычно выводит его сам. Он нужен, когда две позиции должны остаться связаны, как в `first<T>(items: readonly T[]): T | undefined`. Если функция принимает только `User`, параметр — это `User`.

```ts
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

- `extends` здесь — ограничение, не наследование классов. `T = unknown` — только значение по умолчанию. `T extends { id: string } = ...` и ограничивает, и даёт умолчание.
- `fn("ok", 0)` не становится `string | number`. Первая позиция фиксирует `T`, вторая только проверяется, поэтому `0` — это не `"ok"`.
- Тихо ломается список литералов плюс ещё одно значение: `createStreetLight(["red", "yellow"], "blue")` расширяет union и включает `"blue"`. `NoInfer<C>` (TypeScript 5.4) проверяет этот аргумент и не даёт ему расширить `C`.
- `<const T>` (TypeScript 5.0) сохраняет `readonly ["/home", "/users"]` вместо расширения до `string[]`.
- Голый `T extends U ? X : Y` раздаётся по union. `ToArray<string | number>` — это `string[] | number[]`. Чтобы остановить раздачу, заверни так: `[T] extends [U]`.
- Возвраты ковариантны. Параметры при `strictFunctionTypes` контравариантны: `(animal: Animal) => void` можно использовать как `(dog: Dog) => void`, наоборот — нет. Синтаксис методов эту проверку пропускает, поэтому колбэк типизируй как свойство-функцию.
- Дженерик-функция выводит `T` на каждом вызове. Дженерик-класс фиксирует `T` у экземпляра. `get<T>(id): Promise<T>` не проверен, пока метод сам не валидирует значение.
- Убери `T`, если он встречается один раз или только как `unknown`. Не ограничивай через `object`: туда входят массивы и функции.

---

## 5. Narrowing

Narrowing — это поток управления, который сужает union. Проверки: `typeof`, `===`, `== null`, `in`, `instanceof`, `Array.isArray`, дискриминант в `switch`, type guard и assertion function. `as` — не проверка.

```ts
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: User }
  | { status: "error"; error: string };

function text(state: State): string {
  switch (state.status) {
    case "idle":
    case "loading":
      return state.status;
    case "success":
      return state.data.name;
    case "error":
      return state.error;
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}
```

- `typeof null` равен `"object"`, поэтому рядом нужно `!== null`. Для классов используй `instanceof`.
- `== null` — единственное место, где я пишу `==`. Оно покрывает и `null`, и `undefined`.
- Дискриминант лучше необязательных полей (`data?: User; error?: string`). Union делает недопустимую комбинацию невыразимой. `never` в `default` роняет сборку, если новый вариант не обработан.
- `value is User` говорит проверщику, что значит `true`. Тело функции TypeScript не доказывает. `filter(isDefined)` меняет тип элемента. `filter(Boolean)` ещё и выкидывает `0` и `""`.
- `asserts value is User` сужает после вызова, потому что другой путь бросает ошибку.
- Сужение свойства пропадает после вызова функции: вызываемый код мог изменить объект. Скопируй значение в `const`.
- `!` и `as` уместны там, где проверка только что была, а проверщик её не видит. `satisfies` проверяет значение и сохраняет более узкий выведенный тип. Внутри `if` он не сужает.

---

## 6. Utility types — практические советы

Утилиты держат производный тип привязанным к источнику. `Pick<User, "id" | "name">` последует за `User["id"]`, когда тот изменится. Скопированный руками интерфейс — нет. Если «публичный пользователь» — настоящее понятие, дай ему имя: `type PublicUser = Omit<User, "passwordHash">`.

```ts
type UserPatch = Partial<Pick<User, "name" | "email">>;
type PublicUser = Omit<User, "passwordHash">;
```

- Для тела PATCH сначала `Pick` редактируемых ключей, потом `Partial`. `Partial<User>` заодно сделает необязательным `id`.
- `Partial` и `Readonly` поверхностные, и `Partial` не добавляет `null`. С `exactOptionalPropertyTypes` тип `{ name?: string }` отвергает `{ name: undefined }`.
- `Omit<A | B, "id">` схлопывается в `{ kind: "a" | "b" }`. `keyof` от union — только общие ключи, остальные поля исчезают. Сначала раздай: `T extends unknown ? Omit<T, K> : never`.
- `Omit<User, "passwordHsh">` компилируется и ничего не удаляет, потому что `K extends keyof any`. `Pick` такую опечатку отвергает.
- `as const satisfies Record<Role, string>` проверяет, что каждый ключ есть, и сохраняет литералы. Аннотация `Record<Role, string>` расширяет значения до `string`.
- С `noUncheckedIndexedAccess` тип `record[key]` — это `T | undefined`. Обработай отсутствующий ключ.
- `ReturnType` у перегрузки — это последняя сигнатура.
- `Partial` руками — это `{ [K in keyof T]?: T[K] }`. `Pick` — `{ [P in K]: T[P] }`. Форма `{ [K in keyof T] }` раздаётся по union. `Pick` — нет: `Pick<A | B, "kind">` это `{ kind: "a" | "b" }`.
- Утилита не заставит `JSON.parse` вернуть `User`. Это либо схема, либо `as`.
