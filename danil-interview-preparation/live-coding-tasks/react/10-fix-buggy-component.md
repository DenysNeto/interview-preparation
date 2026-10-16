# Fix a Buggy React Component

## Statement
You are given several buggy React snippets.  
For each one: name the bug, explain the root cause in one or two sentences, and write the smallest correct fix.

Practice one bug at a time. Do not look at the fixed version until you have said the cause out loud.

## Requirements
- Explain the root cause before writing the fix.
- Keep React 18+ and TypeScript.
- Prefer the smallest safe fix over a rewrite.
- Mention cleanup, keys, and functional updates when they are the actual fix.

## Time box
15-20 minutes per bug. Full set: about 90 minutes.

## What interviewers look for (Что ищут)
- Быстро назвать класс бага, а не переписывать компонент наугад.
- Stale closure, cleanup, keys, race и бесконечный effect — разными словами.
- Минимальный фикс: functional update, cleanup, стабильный `key`, abort, иммутабельное обновление.
- Умение сказать, какой фикс хуже и почему (`[count]` в deps пересоздаёт interval).

## Hints
> - Если значение «застыло» — callback видит старый render. Спроси, что лежит в замыкании.
> - Если страница зависла — effect пишет state, от которого сам зависит.
> - Если после удаления «чужой» текст остаётся в инпуте — список склеен по индексу.
> - Если быстрый ввод показывает старый ответ — гонка запросов, нет отмены.
> - Если `push`/`sort` на state «иногда» не рисует — мутация той же ссылки.

## Reference solution

### 1. Stale closure in `setInterval`

Счётчик замирает на `1`. Callback интервала замкнул `count` из первого render (`0`), а effect с `[]` больше не перезапускается.

```tsx
export function BuggyCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCount(count + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return <p>Count: {count}</p>;
}
```

Фикс: functional update. Интервал один, cleanup на unmount остаётся.

```tsx
useEffect(() => {
  const id = window.setInterval(() => {
    setCount((prev) => prev + 1);
  }, 1000);
  return () => window.clearInterval(id);
}, []);
```

Хуже: добавить `count` в deps. Счётчик поедет, но интервал будет сбрасываться каждую секунду.

### 2. Effect loop

Страница зависает. Effect зависит от `user`, создаёт новый объект и снова пишет в `user`.

```tsx
export function BuggyProfile({ id }: { id: string }) {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    setUser({ id, name: "Ada" });
  }, [user, id]);

  return <p>{user?.name}</p>;
}
```

Фикс: эффект зависит только от входа, не от значения, которое сам записывает.

```tsx
useEffect(() => {
  setUser({ id, name: "Ada" });
}, [id]);
```

Тот же класс бага: `useEffect(() => { fetch(...).then(setItems); }, [items])` и inline-объект в deps (`useEffect(fn, [{ id }])`), потому что `{ id }` — новая ссылка на каждом render.

### 3. Index as `key`

Удаление строки сверху оставляет текст в «чужом» инпуте. React склеивает соседей по индексу, а state инпута живёт в дочернем компоненте.

```tsx
function Row({ item }: { item: { id: string; text: string } }) {
  const [draft, setDraft] = useState(item.text);
  return <input value={draft} onChange={(e) => setDraft(e.target.value)} />;
}

export function BuggyList({
  items,
  onRemove,
}: {
  items: { id: string; text: string }[];
  onRemove: (id: string) => void;
}) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>
          <Row item={item} />
          <button type="button" onClick={() => onRemove(item.id)}>
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
```

Фикс: стабильный id. `key={index}` допустим только для статичного списка без перестановок и без state внутри строки.

```tsx
<li key={item.id}>
```

### 4. Fetch race

Быстрый ввод: ответ на старый запрос приходит последним и затирает новый.

```tsx
export function BuggySearch({ query }: { query: string }) {
  const [result, setResult] = useState("");

  useEffect(() => {
    fetch(`/api/search?q=${query}`)
      .then((res) => res.json())
      .then((data: { text: string }) => setResult(data.text));
  }, [query]);

  return <p>{result}</p>;
}
```

Фикс: отменять прошлый запрос и не писать state после abort.

```tsx
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/search?q=${query}`, { signal: controller.signal })
    .then((res) => res.json())
    .then((data: { text: string }) => setResult(data.text))
    .catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setResult("Failed");
    });

  return () => controller.abort();
}, [query]);
```

### 5. Mutating state

`push` меняет тот же массив. `setItems(items)` часто не вызывает render, потому что ссылка не изменилась.

```tsx
export function BuggyTodos() {
  const [items, setItems] = useState<string[]>([]);

  function add(text: string) {
    items.push(text);
    setItems(items);
  }

  return (
    <>
      <button type="button" onClick={() => add("New")}>
        Add
      </button>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  );
}
```

Фикс: новый массив. То же для `sort` и `splice` — сначала копия.

```tsx
function add(text: string) {
  setItems((prev) => [...prev, text]);
}
```

### 6. Listener without cleanup

Каждый render вешает ещё один `resize`. После unmount обработчик продолжает вызывать `setWidth`.

```tsx
export function BuggyWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    window.addEventListener("resize", () => setWidth(window.innerWidth));
  });

  return <p>{width}</p>;
}
```

Два бага: нет массива зависимостей (эффект на каждый render) и нет cleanup.

```tsx
useEffect(() => {
  const onResize = () => setWidth(window.innerWidth);
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}, []);
```

### 7. Props copied into state

`email` в state берётся только на mount. Смена `userId` рисует почту предыдущего пользователя.

```tsx
export function BuggyEmail({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [value, setValue] = useState(email);

  return (
    <label>
      User {userId}
      <input value={value} onChange={(e) => setValue(e.target.value)} />
    </label>
  );
}
```

Если поле полностью контролируется родителем, state не нужен: `value={email}`.

Если черновик должен сбрасываться при смене пользователя, смени идентичность через `key`:

```tsx
<BuggyEmail key={userId} userId={userId} email={email} />
```

Синхронизировать через `useEffect(() => setValue(email), [email])` можно, но на интервью это хуже: лишний render и легко получить цикл.

## Follow-up questions
- Почему functional `setState` здесь лучше, чем `count` в зависимостях?
- Что будет, если забыть cleanup у `setInterval` или `addEventListener`?
- Чем `key={index}` опасен, а когда он безопасен?
- Как воспроизвести гонку fetch в тесте?
- Почему `setItems(items)` после `push` может не перерисовать компонент?
- Когда `key` на компоненте лучше, чем `useEffect`, который копирует props в state?
