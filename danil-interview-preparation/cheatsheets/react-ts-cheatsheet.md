# React + TypeScript Cheatsheet

Краткая шпаргалка для live coding. Не учи наизусть — держи рядом в Day 1–2.

## Component props

```tsx
type ButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
};

function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

## Generics

```tsx
type ListProps<T> = {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
};

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item) => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

## Discriminated state (async)

```tsx
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };
```

## Hooks patterns

### useDebounce

```tsx
function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
```

### usePrevious

```tsx
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
```

### Fetch + AbortController

```tsx
useEffect(() => {
  const controller = new AbortController();
  let cancelled = false;

  async function load() {
    try {
      setStatus('loading');
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!cancelled) setData(data);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      if (!cancelled) setError(String(e));
    }
  }

  load();
  return () => {
    cancelled = true;
    controller.abort();
  };
}, [url]);
```

## useReducer shape

```tsx
type CartItem = { id: string; name: string; qty: number; price: number };

type Action =
  | { type: 'ADD'; item: Omit<CartItem, 'qty'> }
  | { type: 'REMOVE'; id: string }
  | { type: 'SET_QTY'; id: string; qty: number }
  | { type: 'CLEAR' };

function cartReducer(state: CartItem[], action: Action): CartItem[] {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find((i) => i.id === action.item.id);
      if (existing) {
        return state.map((i) =>
          i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [...state, { ...action.item, qty: 1 }];
    }
    case 'REMOVE':
      return state.filter((i) => i.id !== action.id);
    case 'SET_QTY':
      return state.map((i) =>
        i.id === action.id ? { ...i, qty: action.qty } : i,
      );
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}
```

## Portal + ESC modal (skeleton)

```tsx
createPortal(
  <div role="dialog" aria-modal="true" aria-labelledby="title">
    ...
  </div>,
  document.body,
);

useEffect(() => {
  if (!open) return;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', onKey);
  return () => document.removeEventListener('keydown', onKey);
}, [open, onClose]);
```

## Memoization — когда нужно

- `React.memo` — дорогой child, стабильные props.
- `useMemo` — тяжёлый compute или стабильная ссылка для deps.
- `useCallback` — колбэк в deps / memoized child.
- **Не** мемоизируй всё подряд на интервью — сначала correctness.

## Частые баги

| Баг | Симптом | Фикс |
| --- | --- | --- |
| Stale closure | Старый state в timeout/effect | functional update / refs |
| Missing key | Weird list bugs | stable unique id |
| Effect loop | Бесконечные запросы | deps / не класть object без memo |
| Race | Старый ответ перетирает новый | abort / ignore flag |
| Controlled input | cursor jump / warning | `value` + `onChange` вместе |

## localStorage persist

```tsx
const [todos, setTodos] = useState<Todo[]>(() => {
  try {
    const raw = localStorage.getItem('todos');
    return raw ? (JSON.parse(raw) as Todo[]) : [];
  } catch {
    return [];
  }
});

useEffect(() => {
  localStorage.setItem('todos', JSON.stringify(todos));
}, [todos]);
```
