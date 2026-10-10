# JavaScript Interview Study Guide: React

Concise, answer-first explanations you can say aloud in an interview. Use the examples when the interviewer asks you to go deeper.

React renders UI from state. A component is a function of `props` and `state`. You do not mutate the DOM yourself for normal updates. You change state, React reconciles, and it updates the DOM.

---

## Functional Components, Props, and State

### What is a component, and how do props differ from state?

A function component returns React elements. **Props** are inputs from the parent. They are read-only. **State** is data the component owns and can change over time. Changing state schedules a re-render.

```jsx
function Counter({ initial }) {
  const [count, setCount] = useState(initial);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

`initial` is a prop. `count` is state. The parent can pass a new `initial` later, but that does not reset state unless the component remounts (a new `key`) or you sync it yourself.

Props and state must be treated as immutable. Replace objects and arrays. Do not `push` into state.

---

## Unidirectional Data Flow

### What does “one-way data flow” mean?

Data flows **down** as props. Events flow **up** as callbacks. A child does not reach into a parent and change its variables. The parent owns the state and passes both the value and the updater.

```jsx
function Parent() {
  const [value, setValue] = useState("");
  return <Search value={value} onChange={setValue} />;
}
```

This keeps the source of truth obvious. If two components need the same data, lift that state to the closest common parent, or put it in a store or server cache.

---

## Controlled and Uncontrolled Components

### When is an input controlled?

**Controlled:** React state is the source of truth. The DOM value follows props or state on every render.

```jsx
<input value={text} onChange={(e) => setText(e.target.value)} />
```

**Uncontrolled:** the DOM owns the value. React reads it when it needs to, usually through a ref.

```jsx
const ref = useRef(null);
<input ref={ref} defaultValue="Ada" />
// later: ref.current.value
```

Use controlled inputs when you validate as the user types, disable a submit button, or format the value. Use uncontrolled when you only need the value on submit and do not want a re-render per keystroke. Do not switch a component from controlled to uncontrolled (or the reverse) without remounting it. `value={undefined}` is uncontrolled. `value=""` is controlled.

A file input is always uncontrolled. You cannot set `value` on `<input type="file">`.

---

## Lifting State Up

### When do you lift state?

When two siblings must stay in sync, move the state to their closest common parent and pass it down. The parent becomes the single source of truth.

```jsx
function App() {
  const [query, setQuery] = useState("");
  return (
    <>
      <SearchBox query={query} onChange={setQuery} />
      <Results query={query} />
    </>
  );
}
```

Do not lift by default. Local state is easier to follow. Lift only when a second component actually needs the value.

---

## Composition

### How do you compose components instead of configuring them with flags?

Pass elements as props or as `children`. The parent decides layout. The child does not import every possible variant.

```jsx
function Card({ title, children, footer }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
      <footer>{footer}</footer>
    </section>
  );
}
```

Prefer composition over a component that takes `isPrimary`, `showIcon`, `variant`, and `mode` for every product case. Specialization is a wrapper: `function PrimaryButton(props) { return <Button variant="primary" {...props} />; }`.

---

## `children` and Render Props

### What are `children` and render props?

`children` is a prop. It is whatever you put between the opening and closing tags: a node, text, or an array of nodes. `React.ReactNode` includes `null`, booleans, strings, numbers, elements, and arrays of those.

A **render prop** is a function prop that returns UI. The child calls it with data it owns.

```jsx
function Mouse({ render }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return <div onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}>{render(pos)}</div>;
}
```

Hooks replaced most render-prop data sharing. Use render props when the parent must control markup and the child owns the behavior (a headless list, a disclosure). `children` as a function is the same idea: `<List>{(item) => <Row item={item} />}</List>`.

---

## Reconciliation and the Virtual DOM

### What is the virtual DOM, and what is reconciliation?

The virtual DOM is the tree of plain React elements your render returns. It is not the browser DOM. **Reconciliation** is the algorithm that diffs the previous element tree with the next one and decides which DOM updates to make.

React walks both trees. Same component type in the same position: it updates props and reuses the DOM instance. Different type (`div` to `span`, or `Button` to `Link`): it unmounts the old subtree and mounts the new one. State lives on the component instance at that position, so a type change resets state.

React does not diff the whole document against the browser on every keystroke. It diffs its own element trees, then applies a small set of DOM operations.

---

## Keys

### What is `key` for, and what are the rules?

`key` tells React which item in a list is which **across renders**. It is an identity, not a style. With stable keys, React can reorder, insert, and delete without reusing the wrong component state.

```jsx
{users.map((user) => <UserRow key={user.id} user={user} />)}
```

Requirements:

- Unique among **siblings**, not globally unique in the app
- Stable across renders for the same item
- Do not use the array index if the list is reordered, filtered, or items are inserted in the middle. Index keys attach state to the position, so a deleted row leaves the next row with the previous row’s state.
- Do not generate a random key during render (`key={Math.random()}`). That remounts every item every time.

Keys are not passed as a prop. `props.key` inside the child is `undefined`.

A `key` on a single child (`<Form key={userId} />`) remounts that subtree when the key changes. That is the clean way to reset state when the entity changes.

---

## When a Component Re-renders

### What schedules a re-render?

A component function runs again when:

1. Its own `useState` or `useReducer` update is processed
2. Its parent re-rendered and rendered this child again
3. A context it consumes changed
4. Its store subscription fired (Redux, Zustand, and similar)

A parent re-render re-renders children by default, even if their props look the same. `React.memo` skips that only when props are shallowly equal. State updates are asynchronous from your perspective: several `setState` calls in one event are batched, and you do not read the new value on the next line.

Rendering is not the same as a DOM write. If the render output is identical, React can bail out of DOM updates, but the function still ran.

`setState` with the same value as the current state (`Object.is`) bails out and does not re-render the child consumers of that update. A new object `{}` is never the same reference, even if the fields match.

---

## Strict Mode

### What does React Strict Mode change?

In development, `<StrictMode>` renders components twice, runs effects, then runs their cleanup, then runs effects again. It also warns on legacy APIs. Production does not double-invoke.

The point is to surface bugs that assume mount happens once: a subscription that is not cleaned up, a state update that is not safe to repeat, a side effect during render. If a double fetch in development surprises you, the effect is missing a cleanup or a cache, not “Strict Mode is broken.”

---

## Synthetic Events

### What is a synthetic event?

React registers delegation on the root and gives you a `SyntheticEvent` wrapper with the same interface across browsers (`stopPropagation`, `preventDefault`, `target`, `currentTarget`). In React 17+ that root listener is on the React root container, not on `document`.

The wrapper is pooled no longer (that was old React). You can read `event.target.value` asynchronously. Native and React trees still differ: a React `stopPropagation` does not stop a native listener on `document` that was attached outside React, and the order depends on which root the listener sits on.

Pass the handler, do not call it during render: `onClick={handleClick}`, not `onClick={handleClick()}`.

---

## Portals

### What problem does `createPortal` solve?

A portal renders children into a DOM node outside the parent’s DOM hierarchy, while they stay in the React tree.

```jsx
createPortal(<Dialog />, document.getElementById("modal-root"));
```

CSS overflow and `z-index` on the parent no longer clip the dialog. Events still bubble through the **React** tree, so a click inside the portal can be handled by a React parent. Use portals for modals, tooltips, and menus that must escape a stacking context. Focus management and `aria-modal` are still your job.

---

## Error Boundaries

### What do error boundaries catch?

A class component with `static getDerivedStateFromError` or `componentDidCatch` catches render errors, lifecycle errors, and constructor errors in the **child** tree. It renders fallback UI instead of unmounting the whole app.

They do **not** catch:

- errors in event handlers
- async errors (`setTimeout`, promises, `fetch`)
- errors in the boundary itself
- server-side errors in the old SSR model

There is still no hook equivalent of `componentDidCatch`. Wrap risky subtrees (a widget, a route) so one failure does not blank the page. For event and async errors, use `try/catch` and store an error in state, or a route-level `errorElement`.

---

## Rules of Hooks

### What are the Rules of Hooks?

1. Call hooks only at the top level. Not inside `if`, loops, or nested functions. The order must be the same on every render, because React stores hook state in a list by call order.
2. Call hooks only from React function components or from custom hooks.

A condition belongs **inside** the hook (`if` inside `useEffect`), not around the `useState` call. Early `return` before a hook is the same bug. ESLint `react-hooks/rules-of-hooks` enforces this.

---

## `useState` and Functional Updates

### When do you use the function form of `setState`?

When the next state depends on the previous state, or the update might be stale.

```jsx
setCount((c) => c + 1);
setCount((c) => c + 1); // both see the latest queued value
```

`setCount(count + 1)` twice in one handler uses the same `count` from that render, so one increment is lost. Also use the function form in effects and subscriptions where the closure may hold an old `count`.

If the next state does not depend on the previous one (`setUser(data)`), the function form adds nothing. Passing a function that React should store as state requires the function form too, or React will call it: `setFn(() => myFunction)`.

Lazy init runs only on mount: `useState(() => expensive())`.

---

## `useEffect`: Dependencies, Cleanup, Stale Closures

### What is an effect, and what goes in the dependency array?

`useEffect` runs after paint. It is for synchronizing with something outside React: a subscription, a timer, a manual DOM call, an analytics ping. Fetching in an effect works, but a cache library is usually a better source of server state.

The dependency array is “which values from this render the effect closes over.” Include every reactive value you read inside the effect. The linter (`exhaustive-deps`) is right more often than a suppressed warning.

```jsx
useEffect(() => {
  const id = setInterval(() => onTick(count), 1000);
  return () => clearInterval(id);
}, [count, onTick]);
```

**Cleanup** runs before the next effect and on unmount. Use it to clear timers, remove listeners, and abort fetches. Without cleanup, Strict Mode and fast navigation leak work and apply stale responses.

A **stale closure** is an effect or callback that captured old state because that state was missing from the dependency list. The interval above without `count` in the array keeps ticking the first `count` forever.

Do not “fix” a loop by deleting a dependency. Fix the loop: stabilize the function with `useCallback`, move the function inside the effect, or store the latest callback in a ref if you truly need a subscription created once.

Empty deps `[]` means “the mount snapshot only.” That is correct for “run once” only when the effect really does not read props or state.

---

## `useLayoutEffect` vs `useEffect`

### When do you need `useLayoutEffect`?

`useLayoutEffect` runs after DOM updates and **before the browser paints**. `useEffect` runs after paint.

Use layout effect to measure the DOM and synchronously update layout so the user never sees the wrong frame (tooltip position, a scroll restore). It blocks paint, so it is the wrong place for fetching or logging.

On the server there is no layout. `useLayoutEffect` warns during SSR. Prefer `useEffect` unless you can point at a visual glitch.

---

## `useRef`

### What are the two jobs of a ref?

1. Hold a DOM node: `<input ref={inputRef} />`, then `inputRef.current.focus()`.
2. Hold a mutable value that must survive renders **without** causing a render: a timer id, a previous prop, an `AbortController`, the latest callback.

```jsx
const renders = useRef(0);
renders.current += 1; // no re-render
```

Updating `ref.current` does not notify React. The screen will not update until something else renders. Do not read or write `ref.current` during render to derive UI, except for lazy initialization patterns React documents. If the UI must show the value, it belongs in state.

`useRef(null)` does not recreate the object. The same ref object is returned every render.

### What are the tricky non-DOM uses?

A ref is a box that survives renders. Writing `.current` does not schedule a render. These three patterns are the ones interviews actually ask about.

**1. Latest callback inside a long-lived effect**

An effect with `[]` closes over the first props. Putting `onTick` in the dependency array restarts the interval every time the parent passes a new function. A ref keeps the subscription stable and still calls the newest function.

```jsx
function Ticker({ onTick }) {
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    const id = setInterval(() => onTickRef.current(), 1000);
    return () => clearInterval(id);
  }, []);
}
```

The interval is created once. Each tick reads `onTickRef.current`, which render just updated. Say this only after you tried the simpler fix: move the function inside the effect, or stabilize it with `useCallback`. The ref is the escape hatch when the subscription truly must be created once. It is also why you sometimes suppress `exhaustive-deps` on purpose, with a comment.

**2. A timer id or abort handle that must not re-render**

Debounce needs the previous timeout id on the next keystroke. Storing that id in state would render on every reset. The ref only remembers the pending work. `setQuery` is what actually renders.

```jsx
function Search() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const timer = useRef(null);

  function onChange(value) {
    setInput(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setQuery(value), 300);
  }

  useEffect(() => () => clearTimeout(timer.current), []);
}
```

The same slot holds an `AbortController` or a request id so a slow response for an old query can be ignored:

```jsx
const controllerRef = useRef(null);

function load(url) {
  controllerRef.current?.abort();
  const controller = new AbortController();
  controllerRef.current = controller;
  return fetch(url, { signal: controller.signal });
}
```

**3. The previous value**

During render, `prev.current` is still the last committed value. The effect updates it after paint.

```jsx
function SearchResults({ query }) {
  const prev = useRef(query);

  useEffect(() => {
    if (prev.current !== query) {
      // query just changed; reset page, fire analytics, etc.
    }
    prev.current = query;
  }, [query]);
}
```

Do not use this to draw the previous query on screen. By the time you read it in render, you are looking at a value React did not track. If the UI must show “previous” and “current” together, store both in state.

**Interview line:** a ref is for identity that must outlive a render without becoming a reason to render. DOM nodes, timer ids, abort controllers, and the latest callback. Anything the user should see belongs in state.

Run the same four cases and watch the console: [projects/ref-playground](../projects/ref-playground/README.md).

---

## `useMemo` and `useCallback`

### What do they actually cache?

`useMemo` caches a **calculated value** until a dependency changes. `useCallback` caches a **function identity**. `useCallback(fn, deps)` is `useMemo(() => fn, deps)`.

```jsx
const sorted = useMemo(() => sort(items), [items]);
const onSelect = useCallback((id) => setSelected(id), []);
```

They do not make the first render faster. They skip work or keep a reference stable on later renders. Use them when:

- a child is wrapped in `React.memo` and this prop was breaking it
- the value is a dependency of another hook and a new reference would retrigger an effect
- the calculation is actually expensive (measure first)

A new object literal in JSX (`style={{ color }}`) is a new reference every render. Memoizing it matters only if a memoized child or a hook depends on it.

---

## `React.memo`

### When does `memo` skip a render?

`memo(Component)` shallow-compares props. If every prop is `Object.is` equal to the last render, the child function does not run.

It does nothing if the parent passes `onClick={() => ...}` or `items={items.filter(...)}` inline, because those are new references. Pair it with stable callbacks and stable element references. It also does nothing for the component’s own state updates. Context changes still re-render a consumer inside the memoized child.

Default compare is shallow. A custom compare function is rare and easy to get wrong.

---

## `useReducer`

### When is a reducer clearer than several `useState` calls?

When the next state depends on the previous state in several related ways, or many events update the same object. The reducer is `(state, action) => nextState`. It must be pure.

```jsx
function reducer(state, action) {
  switch (action.type) {
    case "increment":
      return { ...state, count: state.count + 1 };
    default:
      return state;
  }
}
const [state, dispatch] = useReducer(reducer, { count: 0 });
```

`dispatch` is stable. That is useful for effects and for passing an updater down without changing identity. Reach for `useState` when you have one or two independent fields.

---

## Context API

### What is context for?

Context passes a value to a subtree without threading props through every layer. It is a dependency injection channel: theme, locale, the current user, a design-system config.

```jsx
const ThemeContext = createContext("light");
function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Page />
    </ThemeContext.Provider>
  );
}
function Page() {
  const theme = useContext(ThemeContext);
}
```

Every consumer re-renders when that provider’s `value` changes. A new object `<Provider value={{ theme, setTheme }}>` every render changes the value every time, even if `theme` did not. Memoize that object, or split contexts (one for the value, one for the setter).

Context is a poor place for high-frequency data (mouse position, every keystroke). Consumers far away still re-render.

---

## Custom Hooks

### What belongs in a custom hook?

A function whose name starts with `use` and that calls other hooks. It shares **stateful logic**, not UI. `useDocumentTitle(title)`, `useDebouncedValue(value, 300)`, `useAuth()`.

Each call has its own state. Two components calling `useCounter()` do not share a count. Sharing data is context or a store. A hook should expose a small return value and hide the effects and refs.

---

## `useTransition` and Deferred Rendering

### How do you keep typing fast when a render is expensive?

`useTransition` marks a state update as non-urgent. React can keep the old UI on screen while it renders the new one, and it can interrupt that render.

```jsx
const [isPending, startTransition] = useTransition();
function onChange(next) {
  setInput(next); // urgent: the text field
  startTransition(() => setQuery(next)); // the heavy list
}
```

`useDeferredValue(query)` is the same idea when you do not control the `setState`. The deferred value lags behind. Show `isPending` or the deferred value so the user knows the list is catching up. This does not make the work cheaper. It keeps the interaction responsive. It is not a debounce. The update still runs. It just has lower priority.

---

## Local, Lifted, Global, and Server State

### Where should a piece of state live?

- **Local** — one component cares (`useState` for a disclosure, an input draft).
- **Lifted** — a few related components share it. Closest common parent.
- **Global client state** — many distant parts of the UI share UI state: theme, cart drawer open, wizard step. Context, Zustand, or Redux.
- **Server state** — data that came from the network and can be stale, refetched, and shared by cache key. TanStack Query, SWR, or a router loader. Do not copy it into Redux by default.

The bug is treating a server list as hand-written global state: you then reinvent caching, deduping, and refetch.

---

## Redux Toolkit

### What are the pieces of a Redux app?

One **store** holds the client state tree. A **slice** is a piece of state plus its reducers, built with `createSlice`. Immer lets you “mutate” drafts. You still must not mutate outside the reducer.

**Selectors** read state (`state.cart.items`). Memoized selectors (`createSelector`) derive data without a new reference every time. **Middleware** sits between dispatch and the reducer: `redux-thunk` for async functions, listener middleware for side effects. RTK Query, if you use it, is the server-cache slice and often replaces hand-rolled fetch thunks.

```jsx
const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [] },
  reducers: {
    add(state, action) {
      state.items.push(action.payload);
    },
  },
});
```

Use Redux when many features share client state, you want a single action log (DevTools), or the team already standardizes on it. Do not put the server cache and every input keystroke in the store.

---

## Zustand

### When is a small store enough?

Zustand is a hook-based store outside the React tree. You subscribe to a slice of it. Components re-render only when the selected value changes.

```jsx
const useCart = create((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })),
}));
const items = useCart((s) => s.items);
```

Prefer it for local-app global UI state when Redux’s ceremony is not paying for itself. You still should not duplicate server state here. Select primitives or use a shallow compare when selecting an object, or every new object re-renders the subscriber.

---

## TanStack Query

### What does a query cache give you?

A query is server state keyed by a **query key** (`["user", id]`). The cache dedupes requests, keeps `data` / `error` / `isPending` / `isFetching`, and refetches when you invalidate or when the data is stale.

**`staleTime`** is how long fetched data is considered fresh. During that window, a new subscriber does not refetch. Default `staleTime` is `0`: data is stale immediately, so focus and remount can refetch. **`gcTime`** (formerly `cacheTime`) is how long unused data stays in memory.

**Invalidation:** `queryClient.invalidateQueries({ queryKey: ["user", id] })` marks it stale and refetches active observers. Do this after a mutation that changed that resource.

```jsx
const user = useQuery({
  queryKey: ["user", id],
  queryFn: () => fetchUser(id),
  staleTime: 30_000,
});
```

Query keys should include every variable the fetcher uses. `["user"]` for every id is a bug.

---

## Optimistic Updates

### How do you update the UI before the server answers?

In `onMutate`, cancel outgoing refetches, snapshot the cache, and write the expected result into the cache. On error, restore the snapshot. On settle, invalidate so the server result wins.

```jsx
useMutation({
  mutationFn: renameUser,
  onMutate: async (next) => {
    await queryClient.cancelQueries({ queryKey: ["user", next.id] });
    const previous = queryClient.getQueryData(["user", next.id]);
    queryClient.setQueryData(["user", next.id], (old) => ({ ...old, name: next.name }));
    return { previous };
  },
  onError: (_err, next, ctx) => {
    queryClient.setQueryData(["user", next.id], ctx.previous);
  },
  onSettled: (_d, _e, next) => {
    queryClient.invalidateQueries({ queryKey: ["user", next.id] });
  },
});
```

Only do this when the success case is very likely and you can roll back. A payment is a poor optimistic update. A todo toggle is a good one.

---

## React Router

### How do nested routes, params, loaders, and guards fit?

**Nested routes** render child routes inside a parent `<Outlet />`. The parent layout stays mounted while the child changes.

**Params** are the dynamic segments: `/users/:id` → `useParams().id`. Search strings are separate (`useSearchParams`).

**Loaders** (data routers) fetch before the route renders. The route component reads `useLoaderData()`. That avoids a render-then-fetch waterfall for that route’s data. Loaders run on navigation, not inside an effect.

**Guards** are not a built-in component. You protect a route in a loader (redirect if there is no session) or with a layout route that renders `<Navigate>` when the auth check fails. Do the real check on the server. A hidden link is not authorization.

```jsx
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "users/:id", loader: userLoader, element: <UserPage /> },
    ],
  },
]);
```

---

## Forms and Validation

### How do you structure a form?

Controlled fields if you need live validation and derived UI. Uncontrolled fields plus `FormData` if you only care on submit. Disable the submit button while the request is in flight. Show errors next to the field (`aria-describedby`, `aria-invalid`), not only in a toast.

Validate on the client for fast feedback and **again on the server**. Client checks are not a security boundary. Libraries (React Hook Form) avoid re-rendering the whole form on every keystroke by isolating field state. A schema (Zod) can be shared with the server so the rules do not drift.

---

## Normalizing Data

### Why store entities by id?

Nested API payloads duplicate the same user inside every comment. Updates then miss a copy. A normalized cache stores `usersById` and lists of ids.

```jsx
{ users: { u1: { id: "u1", name: "Ada" } }, postIds: ["p1"] }
```

TanStack Query often normalizes by query key instead (`["user", id]`), which is enough until many lists must update the same entity. Then you either invalidate those lists or write a shared entity into every cached query that contains it.

---

## Loading, Empty, Error, and Success

### What states does every data screen need?

- **Loading** — no data yet. A skeleton or spinner. Do not flash it for a 50ms cache hit if you already have data.
- **Empty** — the request succeeded and the list is empty. Say what to do next.
- **Error** — the request failed. Show a message and a retry. Keep the last good data on screen if you have it (`isError` together with `data`).
- **Success** — render the data.

`isPending` with no `data` is loading. `isFetching` with `data` is a background refresh. Do not replace the whole page with a spinner on every refetch.

---

## Pagination and Infinite Scroll

### How do you load the next page?

**Pagination:** the query key includes the page (`["posts", { page }]`). The UI asks for a page. Simple and shareable URLs.

**Infinite scroll:** `useInfiniteQuery` stores pages. `getNextPageParam` reads the cursor from the last page. `fetchNextPage` appends. Trigger it with an `IntersectionObserver` sentinel, not with a scroll listener on every pixel.

Keep a stable item `key`. Prepend vs append matters for chat (older messages above) versus a feed (newer below). Do not concatenate pages in component state. The query cache already holds them.

---

## API Client, Interceptors, Retry, and Errors

### What belongs in the HTTP layer?

One client (`fetch` wrapper or axios) sets the base URL, JSON headers, and `credentials`. An interceptor or wrapper attaches the access token and, on 401, calls the refresh endpoint once, then retries the original request. Queue parallel 401s so you do not refresh five times.

Retry only idempotent calls and specific statuses (network failure, 429, 503), with a limit and backoff. Do not retry a 400. Map the body to an error type the UI can branch on. Abort with `AbortSignal` when the component unmounts or the query key changes. TanStack Query does the abort, retry, and de-dupe if `queryFn` receives `signal`.

---

## Finding Re-renders in the Profiler

### How do you use the React DevTools Profiler?

Record an interaction. The flamegraph shows which components rendered and how long they committed. “Why did this render?” tells you: props changed, state changed, a hook changed, or a parent rendered. Rank by actual time, not by the number of components. Fix the hot parent that renders a large subtree, not every child in the tree.

Gray or did-not-render means `memo` or a bailout worked. A component that renders in 0.1ms does not need `memo`.

---

## Props Stability and Referential Identity

### Why do equal-looking props still re-render a memoized child?

`memo` uses `Object.is`. Two objects with the same fields are different references if you created them during render.

Unstable:

```jsx
<List items={items.filter(Boolean)} onSelect={(id) => setId(id)} />
```

Stable enough:

```jsx
const visible = useMemo(() => items.filter(Boolean), [items]);
const onSelect = useCallback((id) => setId(id), []);
```

State setters and `dispatch` are already stable. A context value object is the usual accident.

---

## Memoization of Components and Calculations

### What is the order of operations?

1. Fix the data flow so a high-frequency parent does not wrap a large tree.
2. Split the component so the state that changes often lives in a small child.
3. Then `memo` the expensive child and stabilize the props it receives.
4. `useMemo` only for work you measured or for a reference identity you need.

Memoizing a cheap component adds comparison work and code noise.

---

## Code Splitting, `lazy`, and `Suspense`

### How do you load a screen only when it is needed?

`React.lazy` plus dynamic `import()` splits a component into another chunk. `<Suspense fallback>` shows UI while that chunk loads.

```jsx
const Settings = lazy(() => import("./Settings"));
<Suspense fallback={<Spinner />}>
  <Settings />
</Suspense>
```

Split by route, not by every button. The fallback must be inside the suspense boundary above the lazy child. A failed chunk needs an error boundary. Routers can lazy-load route modules the same way.

---

## Virtualizing Long Lists

### When do you window a list?

When you would otherwise mount hundreds or thousands of rows. A windowing library renders only the visible slice plus a small overscan, and positions them in a tall container. The DOM stays small. You still need stable keys and known or measured row heights. Virtualization does not fix a slow row component. It stops you from creating rows the user cannot see.

---

## Bundle Analysis and Tree Shaking

### How do you see what shipped?

Build a production bundle and open the analyzer (source-map-explorer, webpack-bundle-analyzer, or the bundler’s own report). Look for duplicate copies of a library, full locale packs, and a dependency imported for one function.

Tree shaking drops unused `export`s when the package is ESM and you import the named binding, not the whole namespace in a way the bundler cannot follow. `import _ from "lodash"` pulls more than `import debounce from "lodash/debounce"` unless the build is set up for the package’s `sideEffects` flag. Check `sideEffects` in `package.json` before assuming CSS imports are safe to shake.

---

## Avoiding Request Waterfalls

### What is a waterfall, and how do you break it?

A waterfall is request B starting only after request A finishes, even though B did not need A’s result.

```jsx
const user = await fetchUser();
const posts = await fetchPosts(); // waited for no reason
```

Start them together (`Promise.all`, two `useQuery` calls in the same component, or a route loader that awaits `Promise.all`). Nested components that each fetch in `useEffect` waterfall by depth: parent renders, child mounts, then the child fetches. Load that data in the route loader or in the parent in parallel instead. Suspense and RSC can still waterfall if each child awaits its own fetch sequentially. Hoist independent fetches.

---

## Optimizing Context

### How do you stop every consumer from rendering?

- Split a frequently changing value from a rarely changing one (two providers).
- Memoize the `value` object so the parent render does not look like a change.
- Put the state in a store with selectors so only the components that read the changed field subscribe.
- Colocate the provider lower, around the subtree that actually needs it, not around the whole app by habit.

A context consumer re-renders even under `memo`, because context is not a prop.

---

## Automatic Batching

### What gets batched?

React 18 batches state updates from event handlers, promises, and timeouts into one render. Two `setState` calls in a `fetch().then` produce one re-render. You rarely need `unstable_batchedUpdates`. `flushSync` forces a render now. Use it only when you must read the DOM after that update in the same turn.

---

## SSR, CSR, SSG, and Hydration

### How do the rendering modes differ?

- **CSR** — the server sends a shell. The browser downloads JS and then renders. Simple. The first content waits on JS.
- **SSR** — the server renders HTML for the request, the browser paints it, then JS **hydrates**: React attaches listeners to that HTML. Faster first paint, more server cost. Hydration expects the same tree the server rendered. A mismatch (dates, `window` checks, invalid HTML nesting) warns and can repair the DOM expensively.
- **SSG** — HTML is built ahead of time at deploy, not per request. Best for pages that are the same for every user. Regenerating (ISR) is a hosting feature on top of that.
- **Hydration** — not a fourth architecture. It is the client step after SSR or SSG that makes the markup interactive.

Do not read `window` during the server render. Gate browser-only UI so the first client render matches the server.

---

## React Server Components

### What is an RSC, conceptually?

A Server Component runs only on the server. It can read the database or filesystem and render to a payload. It does not ship its implementation to the browser, and it cannot use state or effects. A Client Component (`"use client"`) is the interactive leaf: state, events, browser APIs. Client components are still pre-rendered on the server. The directive marks the module boundary, not “this file skips the server.”

Props passed from a server component to a client component must be serializable. You do not pass functions or class instances across that boundary. The win is a smaller client bundle and data fetching colocated with the UI that needs it, without a client waterfall. The cost is a sharper split between interactive and non-interactive code, and a server that participates in rendering.

---

## Must-Explain Questions

### Why shouldn’t you turn off `exhaustive-deps`?

The lint rule lists values the effect closes over. Removing a dependency does not freeze time. It keeps the old props and state from the render that created the effect. That is the stale-closure bug: a timer, subscription, or request that acts on yesterday’s id. Suppress the rule only when you have a written reason, usually a ref that intentionally holds the latest function, and after you tried moving the function inside the effect or stabilizing it.

### When does memoization make the app slower?

When the saved work is cheaper than the bookkeeping. `useMemo` and `useCallback` allocate the hook cell and compare dependencies every render. `memo` shallow-compares every prop. Around a button that returns a single element, that comparison costs more than re-rendering. Memoization also goes stale if the dependency list is wrong, which is a logic bug, not a speedup. Memoize at a measured boundary: a heavy child, a referentially sensitive dependency, a context value.

### Why doesn’t changing a ref re-render?

A ref is a plain object React stores for you. Writing `ref.current = x` mutates that object. It does not go through the state queue, so no render is scheduled. That is why refs are the right place for timer ids and DOM nodes, and the wrong place for anything the screen must show.

### How do you avoid re-rendering every context consumer?

Keep the provider value stable (`useMemo`), split fast-changing state from slow-changing state into separate contexts, or stop using context for that data and select from a store. Lowering the provider so it does not wrap unrelated routes limits who can be a consumer. `React.memo` on the consumer does not help, because the update did not come through props.

### How do you cancel a request when the component unmounts?

Pass an `AbortSignal` into `fetch` and abort it in the effect cleanup.

```jsx
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/users/${id}`, { signal: controller.signal })
    .then((res) => res.json())
    .then((data) => {
      if (!controller.signal.aborted) setData(data);
    })
    .catch((err) => {
      if (err.name === "AbortError") return;
      setError(err);
    });
  return () => controller.abort();
}, [id]);
```

Cleanup also runs when `id` changes, so the previous response cannot win. TanStack Query passes `signal` into `queryFn` and aborts for you. A boolean `let ignore = false` in cleanup avoids `setState` after unmount, but it does not cancel the network. Prefer abort so the browser can drop the response.
