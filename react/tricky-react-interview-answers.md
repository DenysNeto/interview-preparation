# Tricky React Interview Answers

Spoken answers for the [checklist](tricky-react-interview-topics.md). Each section is what you say first. Longer versions of the core topics are in [react.md](react.md).

---

## Rendering lifecycle and reconciliation

A render is a call of your component function. It returns a tree of plain objects (elements). That tree is not the DOM. Reconciliation compares the previous tree with the next one and decides which host nodes to update, mount, or unmount.

The lifecycle of one update:

1. Something schedules an update: `setState`, `dispatch`, a context change, a store subscription.
2. **Render.** React calls your function. This phase is pure. Concurrent React may pause it, restart it, or throw the result away. No DOM writes, no subscriptions, no network.
3. **Reconcile.** Same position and same type: update props and keep the instance. Different type: unmount the old subtree and mount the new one. A `key` change is a different identity, so state resets.
4. **Commit.** React applies the DOM mutations. This phase is synchronous and is not interrupted.
5. `useLayoutEffect` runs, then the browser paints, then `useEffect` runs.

State lives on the instance at that position in the tree, not on the function. That is why a type swap or a new `key` drops state, and why a parent re-render reuses the child’s state when the child’s type and key stay the same.

---

## Virtual DOM and diffing

The virtual DOM is the element tree from the last render. Diffing walks it against the tree you just returned.

Rules you say out loud:

- Same type at the same position: reuse the DOM node, patch the attributes that changed.
- Different type (`div` to `span`, `Page` to `Login`): destroy the subtree and create a new one. State in that subtree is gone.
- Lists are diffed by `key` among siblings. Without a stable key, React pairs items by index.
- Text and attributes are patched in place. A new element object does not mean a new DOM node.

React does not diff your tree against `document`. It diffs its own trees, then issues a small list of DOM operations. The cost of a render is the JavaScript that ran plus those operations. A render that returns the same structure can still be expensive if the component functions did heavy work.

---

## Component identity, keys, and state preservation or reset

Identity is **type + position + key**. React preserves state when all three match the previous commit.

```jsx
{editing ? <Input /> : <Input />}
```

Those are two different positions. Switching `editing` unmounts one input and mounts the other, so the draft disappears. Put the condition inside one component, or render one `<Input />` and change a prop.

```jsx
<Editor key={documentId} />
```

A new `documentId` is a new identity. React resets all state inside `Editor`. That is the clean way to reset a form when the entity changes. An effect that copies `documentId` into state is the brittle version of the same idea.

Index keys attach state to the slot. Delete the first row and the second row’s component receives the first row’s state. Random keys during render (`key={Math.random()}`) remount on every render. Keys are unique among siblings, stable for the same item, and they are not a prop (`props.key` is `undefined`).

---

## Render phase vs. commit phase

**Render** calculates the next UI. It must be pure: same props and state in, same element tree out. React 18+ may render twice in Strict Mode and may discard a render in concurrent mode. A `setState` during render is only valid for the narrow “adjust state when a prop changed” pattern. Fetching, subscribing, or measuring the DOM during render shows up as double work and torn UI.

**Commit** is when the DOM changes. It runs once for the render that was chosen. Layout effects see the new DOM before paint. Passive effects see it after paint. Side effects that talk to the outside world belong here, or in an event handler.

If a bug appears only in Strict Mode or only when an update is interrupted, the usual cause is a side effect that ran during render.

---

## Batching and asynchronous state updates

Several `setState` calls in one event, timeout, or promise are batched into one render (React 18 automatic batching). The component does not re-render between those lines, and a `console.log(count)` after `setCount` still prints the old value.

```jsx
setCount(count + 1);
setCount(count + 1); // both read the same count; one increment is lost
setCount((c) => c + 1);
setCount((c) => c + 1); // queued on top of each other; +2
```

Updates are asynchronous from your perspective. React applies them on the next render. `flushSync(() => setCount(1))` forces the commit now, so you can read the DOM immediately after. Use it for the rare case where the next line measures layout. It opts out of batching and hurts performance.

A `setState` with an `Object.is` equal value bails out. A new object is never equal to the old one.

---

## Functional state updates and stale state

Use the function form when the next value depends on the previous one, or when the closure might hold an old snapshot: an effect, a timeout, a subscription.

```jsx
setTodos((existing) => [...existing, todo]);
```

The updater receives the latest queued state, including updates that have not rendered yet. Two quick clicks cannot overwrite each other.

`setCount(count + 1)` is fine when this event only increments once and `count` came from this render. It is wrong inside `setInterval` that closed over `count` from mount.

To store a function as state, wrap it once more, or React will call it as an updater: `setFn(() => savedFunction)`.

---

## State immutability

React compares next state to previous state by reference (`Object.is`). Mutating an object and passing the same reference does not re-render, and a later immutable update can look unchanged too.

```jsx
draft.done = true;       // same reference, no render
setTodos([...todos, item]); // new array, render
setUser({ ...user, name }); // new object, render
```

Nested updates copy every level you change. Libraries (Immer, Redux Toolkit) let you write mutating syntax against a draft and still produce a new tree. That syntax is illegal outside the draft.

Immutability is also what makes concurrent rendering safe. An in-progress render can be thrown away. A mutation during that render would already have changed the value the previous screen is showing.

---

## Derived state and avoiding redundant state

If a value can be calculated from props or state during render, it is not state. Duplicating it means two sources of truth that drift.

```jsx
const visible = todos.filter((todo) => todo.done === false);
const remaining = visible.length;
```

`useMemo` around that filter is an optimization, not a second state slot. Reach for it after a measurement, or when the array is a dependency and you need a stable reference.

The trap is copying a prop into state:

```jsx
const [value, setValue] = useState(propValue);
```

`value` stays at the first `propValue`. Syncing it in an effect renders twice and fights the user’s edits. Prefer using `propValue` directly. If the whole subtree should reset when the prop changes, give it a `key`. If you truly need to adjust state when an id changes, do it during render:

```jsx
const [prevId, setPrevId] = useState(id);
if (id !== prevId) {
  setPrevId(id);
  setDraft("");
}
```

React restarts the render. Do not do this for network data.

---

## Controlled vs. uncontrolled components

**Controlled:** React state is the value. The DOM follows it.

```jsx
<input value={text} onChange={(e) => setText(e.target.value)} />
```

**Uncontrolled:** the DOM holds the value. React reads it through a ref, usually on submit. `defaultValue` sets the initial DOM value only.

```jsx
const ref = useRef(null);
<input ref={ref} defaultValue="Ada" />
```

Switching one input from uncontrolled to controlled (or back) warns. `value={undefined}` is uncontrolled. `value=""` is controlled. Initialize controlled state to `""`, not leave it undefined until the first fetch fills it.

Use controlled inputs for live validation, a disabled submit button, or formatting. Use uncontrolled inputs when you only need the value on submit. A file input is always uncontrolled.

---

## Lifting state up

When two siblings must show the same data, move the state to the closest common parent. Pass the value down and the updater down.

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

Lift only when a second component needs the value. State that only one panel uses stays in that panel.

---

## State colocation

Put state in the lowest component that reads and writes it. A modal’s open flag does not belong on the page if only the modal uses it. An input draft belongs next to the input, not in a global store.

Colocation keeps unrelated screens from re-rendering and makes the owner of the data obvious. Lifting and colocation are the same rule read from two sides: one owner, as close to the readers as the sharing requires. Server data is the exception. It is shared by cache key, not by the component that happened to fetch it first.

---

## `useState` initialization and update behavior

`useState(initial)` uses `initial` on the mount only. Later changes to that argument are ignored. The lazy form `useState(() => expensive())` also runs on mount only. In Strict Mode the initializer can run twice, so it must be pure.

Updates:

- `setState(next)` schedules a render. The variable in this closure does not change.
- `setState(prev => next)` queues on the latest state.
- `Object.is(prev, next)` skips the re-render. `setCount(0)` when count is already `0` does nothing. `setUser({ ...user })` always renders, because it is a new object.
- Setting state in an event handler is batched with other updates in that handler.

Storing a function: `useState(() => initialFn)` treats the function as a lazy initializer. To keep a function in state, `useState(() => someFunction)` is actually correct for the initial value (lazy init returns `someFunction`). The trap is the updater: `setState(someFunction)` calls `someFunction(previousState)`. Write `setState(() => someFunction)`.

---

## `useEffect` dependencies

The dependency array is the list of reactive values the effect closes over. Include every prop, state, and function from the component that the effect reads. The linter is right more often than a suppressed warning.

```jsx
useEffect(() => {
  const id = setInterval(() => onTick(count), 1000);
  return () => clearInterval(id);
}, [count, onTick]);
```

`[]` means “the values from the first render only.” That is correct when the effect really does not read props or state. Removing `count` to “stop the interval from resetting” leaves the interval on the first count forever. That is a stale closure, not a fix.

Objects and arrays created during render are new every time. An effect that depends on `options` will re-run every render if the parent passes `options={{ page: 1 }}`. Move the object inside the effect, or memoize it if a child needs the same reference.

The effect callback itself stays synchronous. `useEffect(async () => ...)` returns a Promise, and React reads the return value as the cleanup function. Declare `async function load()` inside and call it. Return the cleanup synchronously.

---

## Effect cleanup and execution order

The setup function runs after the component is on the screen. The cleanup runs before the next setup with new dependencies, and when the component unmounts.

```jsx
useEffect(() => {
  const controller = new AbortController();
  load(id, controller.signal);
  return () => controller.abort();
}, [id]);
```

Order:

- In one component, effects run in the order they are written. Their cleanups run in that same order.
- `useLayoutEffect` flushes after DOM mutations and before paint. `useEffect` flushes after paint.
- Nested mount: the child commits before the parent, so the child’s effect is set up before the parent’s.
- Strict Mode in development runs setup, cleanup, setup, to catch a missing cleanup. Production mounts once.

Cleanup is how you avoid a slow response for `id=1` landing after the user already moved to `id=2`. Abort the request. A boolean `ignore` flag only skips `setState`; the request still finishes.

---

## Avoiding unnecessary Effects

An effect synchronizes React with an external system: a subscription, a timer, a manual DOM call, a widget that is not React. Most other “effects” are derived data or event logic.

Calculate during render:

```jsx
const fullName = first + " " + last;
```

React to the user in the handler that already knows what happened:

```jsx
function addTodo() {
  const next = [...todos, todo];
  setTodos(next);
  onChange(next); // tell the parent here, not in an effect that watches todos
}
```

Reset state with a `key`, not with an effect that watches a prop and calls `setState`.

Do not chain effects (`effect` sets A, another effect watches A and sets B). That is an extra render and a timing bug. Compute B from A during render, or do both writes in the event.

Fetching in an effect works and needs a cleanup. A cache (TanStack Query, a router loader, a Server Component) removes the race, the cache, and the loading flags from the component.

---

## Stale closures in Hooks

A function captures the props and state of the render that created it. A `setInterval` started with `[]` keeps the first `count`. An effect that omitted `query` from its dependencies fetches the first query forever. A `useCallback` with `[]` that reads `count` has the same bug.

Fixes, in the order you try them:

1. Put the value in the dependency array so the effect or callback is recreated.
2. Move the function inside the effect, so it closes over fresh values and is not a dependency.
3. Use the functional updater when you only need the previous state.
4. Hold the latest function in a ref if a subscription must be created once and must still call the newest callback.

```jsx
const onTickRef = useRef(onTick);
onTickRef.current = onTick;

useEffect(() => {
  const id = setInterval(() => onTickRef.current(), 1000);
  return () => clearInterval(id);
}, []);
```

`useEffectEvent` (React 19.2) is the supported version of that ref: a function you call from an effect that always sees the latest props and is not a dependency. You still do not call it during render.

---

## `useRef` vs. `useState`

Both survive renders. Updating state schedules a render. Writing `ref.current` does not.

Use state for anything the screen shows. Use a ref for a DOM node, a timer id, an `AbortController`, a previous value you must not display, or the latest callback inside a long-lived effect.

```jsx
const inputRef = useRef(null);
inputRef.current.focus();
```

`useRef(null)` returns the same object every render. Reading or writing `ref.current` during render to derive JSX is a bug: React did not track that write, and concurrent rendering may discard it. The exception is lazy initialization that only fills `current` when it is null.

A ref change does not trigger `useEffect`. If the UI must react, it is state.

---

## `useMemo` vs. `useCallback`

`useMemo` caches a calculated value. `useCallback` caches a function identity. `useCallback(fn, deps)` is `useMemo(() => fn, deps)`.

They do not speed up the first render. They skip work or keep a reference stable later. Use them when a memoized child would otherwise re-render, when a hook dependency would otherwise change every render, or when you measured an expensive calculation.

A new object in JSX (`style={{ color }}`) is a new reference every render. Memoizing it matters only if something compares it. State setters and `dispatch` are already stable. The React Compiler, when it is enabled, inserts a lot of this memoization. Hand-written `useMemo` is still what you explain in an interview, and still what you write when you need a reference the compiler cannot see.

---

## Custom Hooks and the Rules of Hooks

A custom hook is a function named `useSomething` that calls other hooks. It shares stateful logic, not UI and not data. Two components that call `useToggle()` have two independent pieces of state. Sharing the value is context or a store.

Rules:

1. Call hooks only at the top level. Not inside `if`, loops, or nested functions. React stores hook state in a list indexed by call order. A conditional hook shifts every slot after it, so state from one hook is read by another.
2. Call hooks only from function components and from custom hooks.

Put the condition inside the hook. An early `return` before a hook is the same bug. `use` is the exception: it may be called conditionally, because it identifies its promise or context by the value you pass, not only by call order.

---

## `React.memo` and memoization pitfalls

`memo(Component)` shallow-compares props. If every prop is `Object.is` equal to last time, the child function does not run.

It does nothing when:

- the parent passes `onClick={() => ...}` or `items={items.filter(...)}`, because those are new references
- the child has its own state update
- a context the child consumes changes (`memo` does not block context)
- `children` is a new element created by the parent, which is almost always

A custom comparison function is easy to get wrong and hides updates. Memoizing a cheap button costs more than rendering it. Memoize a measured slow child, then stabilize the props that child receives.

`memo` compares the props you pass. It does not compare hooks inside the parent. The parent still ran.

---

## Context API and unnecessary re-renders

Context sends a value to a subtree without threading props through every layer. Every consumer of that context re-renders when the provider `value` changes, including consumers under `memo`.

The usual accident is a new object on every render:

```jsx
<ThemeContext.Provider value={{ theme, setTheme }}>
```

That value is new every time, so every consumer re-renders even when `theme` did not change. Memoize the object, or split into two contexts: one for `theme`, one for `setTheme`. The setter context never changes, so components that only dispatch do not re-render when the theme does.

Context is a poor fit for high-frequency data (mouse position, every keystroke). Those updates re-render every consumer. A store with selectors, or state colocated in the small subtree that uses it, is the fix. Put the provider as low as the readers allow, not around the whole app by habit.

---

## Reducers with `useReducer`

`useReducer` is for related transitions over one piece of state. The reducer is `(state, action) => nextState` and must be pure.

```jsx
function reducer(state, action) {
  switch (action.type) {
    case "toggle":
      return { ...state, done: !state.done };
    default:
      return state;
  }
}
const [state, dispatch] = useReducer(reducer, { done: false });
```

`dispatch` is stable across renders. That is useful in an effect dependency list and as a prop to a memoized child. Reach for `useState` when you have one or two independent fields. Reach for a reducer when many events update the same object and the next state depends on the previous one in several ways.

If the next state equals the previous state by `Object.is`, React skips the render. A lazy initializer `useReducer(reducer, arg, init)` runs `init(arg)` on mount.

---

## Portals and event propagation

`createPortal(child, domNode)` renders `child` into a DOM node outside the parent, usually for a modal, tooltip, or menu that must escape `overflow` and `z-index`. The React tree does not change. The portal child is still a child of the component that called `createPortal`.

A click inside the portal bubbles through React parents, even though the DOM parent is `document.body`. `stopPropagation` on the portal stops React parents. It does not automatically stop a native listener that was attached to `document` outside React. A “click outside” listener has to ignore the portaled node, or the modal closes on the same click that opened it.

Focus, `aria-modal`, a focus trap, and restoring focus on close are still your job. The portal only moves the DOM.

---

## Synthetic events

React attaches a delegated listener on the root container (React 17+, not on `document`) and gives you a `SyntheticEvent`. The interface matches the native event across browsers: `preventDefault`, `stopPropagation`, `target`, `currentTarget`.

The event object is not pooled anymore. You may read `event.target.value` after an `await`. In old React that field was null by the time the promise resolved.

`onClick={handleClick}` passes the function. `onClick={handleClick()}` calls it during render.

React’s `stopPropagation` stops React listeners. A native listener on `document` can still run. The order depends on which root the listener is on. For a full stack of React roots and native listeners, do not assume one `stopPropagation` covers both trees.

---

## Form handling and validation

Controlled fields when the UI depends on the value as the user types. Uncontrolled fields plus `FormData` when you only care on submit. In React 19, `<form action={submit}>` can pass `FormData` into an action without a manual `onSubmit`.

Disable the submit control while the request is in flight, and keep the values on screen when the request fails. Show the error on the field (`aria-invalid`, `aria-describedby`), not only in a toast.

Validate on the client for speed. Validate again on the server. Client checks are not a security boundary. A schema shared by both sides (Zod, or the same rules in a Server Action) keeps them from drifting.

A form library (React Hook Form) isolates field state so one keystroke does not re-render the whole form. That is a performance choice, not a different HTML model.

---

## Error boundaries and their limitations

A class component with `static getDerivedStateFromError` or `componentDidCatch` catches errors in rendering, in lifecycle methods, and in constructors of the child tree. It renders fallback UI. There is still no hook equivalent of `componentDidCatch`.

They do not catch:

- errors in event handlers
- errors in `setTimeout`, promises, and `fetch`
- errors in the boundary’s own render
- async errors inside `useEffect`, unless you catch them and rethrow into render or store them in state

For an event or a request, `try/catch` and an error state. For a route, the router’s `errorElement`. For a failed `lazy` import or a rejected `use(promise)`, an error boundary does catch it, because the failure is surfaced during render. Wrap a widget or a route, not only the root, so one panel can fail alone. A boundary does not catch an error in a sibling of itself.

---

## Lazy loading, `Suspense`, and code splitting

`React.lazy(() => import("./Settings"))` loads that component’s chunk on first render. `<Suspense fallback={<Spinner />}>` shows the fallback until the chunk arrives. A failed load rejects into the nearest error boundary.

Split by route. Splitting every button adds requests without saving a meaningful amount of JavaScript. The fallback has to be a parent of the lazy child. The lazy component itself does not pick its fallback.

`Suspense` is also the waiting UI for a promise read with `use` and for Server Components that suspend. The same boundary can cover a slow chunk and slow data. Nested boundaries reveal the page in pieces: the shell stays up, the slow panel shows its own fallback.

---

## Transitions and `useTransition`

A transition is an update React may interrupt. Urgent updates (typing, clicking) paint first. The heavy result can keep the previous UI on screen until it is ready.

```jsx
const [isPending, startTransition] = useTransition();

function onChange(next) {
  setInput(next);
  startTransition(() => setQuery(next));
}
```

`setInput` stays urgent, so the field does not lag. `setQuery` is interruptible, so a slow list does not block the next keystroke. `isPending` is true while the transition has not committed. Show it on the list, not by disabling the input.

`startTransition` does not debounce. The work still runs. It runs at lower priority and can be restarted. Wrapping the input’s own `setState` in the transition makes typing feel late. State updates inside an async React 19 form action are already transitions.

---

## Deferred rendering with `useDeferredValue`

`useDeferredValue(value)` is the transition idea when you do not own the `setState`. You received `value` as a prop. The deferred copy lags behind so a slow child can keep rendering the previous value while the urgent UI uses the new one.

```jsx
const deferredQuery = useDeferredValue(query);
const stale = query !== deferredQuery;
```

Use `stale` to dim the list. This is not a timer. There is no 300ms delay to tune. React defers the update for as long as it needs to stay responsive, then it catches up. A debounce drops intermediate values. A deferred value still renders the latest one when it gets time.

Passing `deferredQuery` into a memoized child is what actually skips the expensive render. Without `memo`, both values live in one component and that component still renders.

---

## Concurrent rendering and interruptible updates

Concurrent rendering means React can prepare several versions of the UI and commit only one. A render may start, pause for a click, restart, or be discarded. That is why render must be pure and why you do not mutate state or write to the DOM during render.

What you control:

- Urgent update: a normal `setState` in an event. The user is waiting on it.
- Transition: `startTransition` or `useDeferredValue`. Interruptible.
- `Suspense`: if a render suspends, React keeps the previous committed UI (or the fallback) until the data is ready. It does not commit a half-finished tree.

Tearing is the bug concurrent mode exposes: one component rendered with store version 1 and a sibling rendered with version 2, because you read a mutable external variable during render. `useSyncExternalStore` fixes that by giving React a snapshot and a subscribe function it can re-read consistently.

You rarely enable concurrency by hand. `createRoot` (React 18+) already uses it. Transitions and Suspense are how you opt updates into being interruptible.

---

## Strict Mode and double execution in development

In development, `<StrictMode>` double-invokes render, and it runs effect setup, cleanup, then setup again. Production does not. The extra pass is there to surface bugs that assume “this happens once”: a subscription with no cleanup, a mutation during render, a state update that is not safe to repeat.

What it does not mean: the effect is broken, or production will fetch twice. If the double fetch corrupts state, the effect is missing a cleanup or the fetch belongs in a cache that dedupes.

Lazy `useState` initializers and render functions must be pure, because Strict Mode may call them twice. Event handlers are not double-invoked. A ref that starts a socket during render will leak. Start it in an effect and close it in the cleanup.

---

## Server Components vs. Client Components

A Server Component runs only on the server. It can `await` a database or a file and render to a payload. It ships no component code for itself to the browser, and it cannot use state, effects, or browser APIs.

A Client Component is a module with `"use client"`. It can use state, effects, and events. It is still pre-rendered on the server, then hydrated. The directive marks where the client bundle starts. It does not mean “skip the server.”

You import a Client Component into a Server Component. You do not import a Server Component into a client module. Pass a Server Component as `children` into a client parent if the parent is a client shell and the content can stay on the server. Props that cross from server to client must be serializable: no functions, no class instances, no `Date` unless you pass a string.

An `async` function component is a Server Component pattern. A client component cannot be `async`.

---

## Server-side rendering and hydration

**CSR:** the server sends a mostly empty HTML shell. The browser downloads JavaScript and then renders. Simple. The first content waits on JS.

**SSR:** for each request, the server renders HTML. The browser paints it, then hydrates: React walks that HTML and attaches listeners. First paint is faster. The server does more work. Hydration expects the client’s first render to match the HTML the server sent.

**SSG:** the HTML is built at deploy time, not per request. Same hydration step afterward. Good for pages that are the same for every user.

**Hydration** is the client step after SSR or SSG, not a separate architecture. `hydrateRoot` attaches to existing markup. `createRoot` would throw that markup away and render from scratch, which is the CSR path.

Do not read `window` during the render that also runs on the server. The server has no `window`. The first client render has to produce the same tree.

---

## Hydration mismatches

A mismatch means the HTML from the server and the first client render disagree. React warns and may discard the server node and replace it, which costs the benefit of SSR and can lose focus.

Common causes:

- `Date.now()`, `Math.random()`, or `crypto.randomUUID()` during render
- `typeof window !== "undefined" ? <ClientOnly /> : <ServerOnly />` in the first render
- locale time that differs between the server timezone and the browser
- invalid HTML nesting (`<p><div>`, `<p><p>`). The browser repairs the DOM before React hydrates, so the nodes no longer match
- a browser extension injecting attributes

`suppressHydrationWarning` is for text that is allowed to differ (a timestamp), on that one element, not for a structural mismatch. The real fix is to render the same thing on both sides, then update after mount in an effect if the client must show something browser-specific. `useId` generates ids that match across server and client. Do not build input ids with `Math.random()`.

---

## Streaming SSR

Streaming sends HTML as it becomes ready instead of waiting for the slowest data. `renderToPipeableStream` / `renderToReadableStream` write the shell first (`onShellReady`), then flush Suspense boundaries as their data resolves, often with inline `<script>` that fills the fallback slot.

The user sees the layout immediately and the slow panel later. Selective hydration can attach listeners to the part the user interacted with before the rest of the page has hydrated.

A Suspense boundary is the unit of streaming. Without one, a slow `await` in the tree holds the shell. Nested boundaries stream independently. This is the same model Next.js uses for server rendering with loading UI. Streaming does not remove waterfalls: if component B awaits component A’s result, B still waits. It removes the wait for siblings that do not depend on each other.

---

## Data fetching, race conditions, and request cancellation

A race: the user asks for `id=1`, then `id=2`, and the response for `1` arrives last and overwrites `2`.

In an effect, abort the previous request in cleanup:

```jsx
useEffect(() => {
  const controller = new AbortController();
  async function load() {
    try {
      const res = await fetch(`/api/users/${id}`, { signal: controller.signal });
      setUser(await res.json());
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err);
    }
  }
  load();
  return () => controller.abort();
}, [id]);
```

The effect stays synchronous. `load` is the async function. Cleanup aborts on unmount and when `id` changes.

TanStack Query keys the cache by `["user", id]`, passes `signal` into `queryFn`, and ignores a resolution that is no longer the active query. A router loader starts the fetch before render, so two sibling routes do not waterfall by mounting one after another. Server Components await on the server. Independent awaits should be started together (`Promise.all`), or a child that awaits its own data becomes a waterfall by depth.

`setState` after unmount is not the crash it was in old React. Writing the stale payload is still a bug. Abort so the browser can drop the response.

---

## Optimistic updates

Show the result you expect, then reconcile with the server. Only when failure is rare and rollback is easy. A todo toggle is a good case. A payment is not.

With `useOptimistic`, the source of truth stays in state or in the cache. The hook shows a temporary copy while a transition or action is in flight, then drops it when the action settles.

With TanStack Query, `onMutate` cancels refetches, snapshots the cache, and writes the expected value. `onError` restores the snapshot. `onSettled` invalidates so the server copy wins.

Always have a rollback path. An optimistic UI with no error branch leaves the screen lying after a 500.

---

## External stores and `useSyncExternalStore`

An external store is mutable data that lives outside React: a browser API, Redux, Zustand, a module-level variable. Reading it during render can tear in concurrent mode, because one part of the tree saw the old value and another saw the new one.

```jsx
const online = useSyncExternalStore(
  (onStoreChange) => {
    window.addEventListener("online", onStoreChange);
    window.addEventListener("offline", onStoreChange);
    return () => {
      window.removeEventListener("online", onStoreChange);
      window.removeEventListener("offline", onStoreChange);
    };
  },
  () => navigator.onLine,
  () => true,
);
```

`subscribe` registers a callback. `getSnapshot` returns the current value and must return a cached reference if nothing changed, or React loops. `getServerSnapshot` is what the server renders, so hydration matches. Skip it only for client-only stores.

`useState` plus `useEffect` to copy the store into state is a frame late and tears. `useSyncExternalStore` is the supported subscription. Redux and Zustand use it internally.

---

## Component composition patterns

Compose with `children` and named slots instead of a component that grows a boolean for every variation.

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

The parent owns layout. The caller owns content. A specialization is a thin wrapper: `function PrimaryButton(props) { return <Button variant="primary" {...props} />; }`.

Containment is `children`. Specialization is a wrapper. Those two cover most “we need another flag” requests. Compound components are the version where the children share hidden state (tabs, a select, a menu).

---

## Render props, Higher-Order Components, and Hooks

A **render prop** is a function prop that returns UI. The child owns the behavior and calls the function with data: `<Mouse>{(pos) => <Dot pos={pos} />}</Mouse>`.

A **HOC** is a function that takes a component and returns a component: `withAuth(Page)`. It wraps the tree, which makes refs, display names, and prop name collisions your problem. Types get noisy.

A **hook** shares the same logic without a wrapper. `const pos = useMouse()`. The component decides the markup. Hooks replaced most HOCs and render props for data and behavior. Render props remain when the parent must control the markup of each item and the child owns the state machine (a headless list, a disclosure). `children` as a function is a render prop.

---

## Compound components

A compound component is a set of components that share implicit state and are used together.

```jsx
<Tabs>
  <Tabs.List>
    <Tabs.Tab id="a">A</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel id="a">...</Tabs.Panel>
</Tabs>
```

`Tabs` holds the selected id in context. `Tab` and `Panel` read it. The caller controls order and layout. You do not pass a giant `tabs={[{...}]}` config that the parent then interprets.

Share state with context, not with `React.Children.map` and `cloneElement`. Cloning breaks when the child is wrapped in another element. Context still reaches it.

The API is flexible and easy to misuse: a `Tab` outside `Tabs` has no provider. Throw a clear error in that case. This pattern fits tabs, accordions, menus, and form fields that need an id shared with their label.

---

## Accessibility in React applications

React does not make a `div` accessible. Use the element that already has the behavior: `button` for an action, `a` for navigation, `label` for a control. A click handler on a `div` is invisible to the keyboard and to assistive tech unless you rebuild role, tabindex, and key handlers. You will miss one.

Tie errors to fields with `aria-invalid` and `aria-describedby`. Give icon-only buttons an accessible name (`aria-label`). After a route change or a dialog open, move focus on purpose. On dialog close, return focus to the control that opened it. Trap focus inside a modal. `aria-live="polite"` announces async results (a toast, “saved”) that were not a focus change.

`useId` is for tying a label to an input when you need a generated id. Do not generate that id with `Math.random()` if the component renders on the server. A portal does not change any of this. The dialog still needs a name, a focus trap, and Escape to close.

---

## Testing components, Hooks, and asynchronous behavior

Test what the user can do. React Testing Library renders the component, and you find elements by role, label, or text. You do not read `useState`.

```jsx
render(<TodoApp />);
await userEvent.type(screen.getByLabelText("New task"), "Ship it");
await userEvent.click(screen.getByRole("button", { name: "Add" }));
expect(screen.getByText("Ship it")).toBeInTheDocument();
```

`getBy` throws if the node is missing. `queryBy` returns null, so it is what you use to assert absence. `findBy` returns a promise and waits, so it is what you use after a fetch or any update that has not painted yet.

`userEvent` fires the same sequence as a browser (focus, keydown, input). `fireEvent` skips that. Prefer `userEvent` for forms. Network calls belong behind MSW or a similar mock at the HTTP boundary, not a mock of `fetch` inside the component module, so the test exercises the real loading and error UI.

`renderHook(() => useCounter())` tests a hook without a dummy component. Wrap it in the providers the hook needs. Async hooks need `await waitFor` or `findBy` in a component test. An `act(...)` warning means an update happened outside the test’s wait. Awaiting the `findBy` is usually the fix. Do not assert on implementation details (component state, private methods). A refactor of the hook should not break a test of the screen.

---

## Performance profiling and avoiding premature optimization

Record the interaction in the React DevTools Profiler. Look at actual time and at “why did this render?”: props changed, state changed, a hook changed, or the parent rendered. Fix the hot parent that re-renders a large tree. A child that took 0.1ms does not need `memo`.

Order of work:

1. Move frequently changing state down so it is not above a large tree.
2. Split context so fast values do not notify slow consumers.
3. Then `memo` the expensive child and stabilize the props it compares.
4. `useMemo` for a measured expensive calculation or for a reference a dependency list needs.

Memoization that is cheaper than the work it saves is a net loss: every render still allocates the hook and compares dependencies. The Profiler is the argument. “I added `useCallback` everywhere” is not.

---

## List virtualization

Window a list when you would otherwise mount hundreds or thousands of rows. A virtualizer renders the visible slice plus a small overscan and positions those rows inside a tall container. The DOM stays small. Scroll position still feels like the full list.

You need stable keys and either a fixed row height or a measured one. Variable heights are the hard part: the library measures after paint and corrects the offset. Virtualization does not make a slow row fast. It stops you from creating rows the user cannot see. Do not virtualize a 20-row menu. The measurement and absolute positioning cost more than the rows.

---

## React security and `dangerouslySetInnerHTML`

React escapes strings in JSX. `<div>{userInput}</div>` cannot inject a tag. The escape hatch is `dangerouslySetInnerHTML={{ __html: html }}`, which parses HTML and skips that escaping.

Use it only for HTML you sanitized (DOMPurify or a sanitizer on the server) or HTML you generated yourself with no user strings. Markdown from a user is user HTML after it is rendered. Sanitize the output.

Other holes that JSX escaping does not close:

- `href={userUrl}` can be `javascript:...`. Allow only `http`, `https`, and relative URLs.
- Rendering unsanitized HTML inside a markdown preview.
- Putting a secret in a client component. Anything in the client bundle is public. Server Components and Server Actions still need an auth check. A hidden button is not authorization.

`dangerouslySetInnerHTML` also bypasses React’s own updates for that subtree and can cause hydration mismatches if the HTML differs from what the client produces.

---

## React 19 Actions and form Actions

An Action is a function React can track as a transition, including an async function. A form action receives `FormData`:

```jsx
async function createTask(formData) {
  await save(formData.get("title"));
}

<form action={createTask}>
  <input name="title" />
  <button type="submit">Add</button>
</form>
```

React wraps the submit in a transition. The form stays interactive. Pending state is read by a child of the form:

```jsx
function Submit() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>Add</button>;
}
```

`useFormStatus` reads the parent `<form>`. Calling it in the same component that renders the form returns nothing useful. Put it in the button component inside the form.

A Server Action (`"use server"`) runs on the server and can be the `action` even before hydration, which is progressive enhancement. Treat it as a public endpoint: check the session inside the function. Arguments and `FormData` are user input. After it mutates data, revalidate the path or the cache tag so the next render sees the write.

A client action that you call yourself from `onSubmit` after `preventDefault` is just your function. Call `startTransition` around it if you want the same pending behavior, or use `useActionState`.

---

## `useActionState`

`useActionState` ties an action to a piece of state and a pending flag. The action receives the previous state and the form payload and returns the next state.

```jsx
async function save(prev, formData) {
  const error = await updateName(formData.get("name"));
  return error ?? { ok: true };
}

const [state, formAction, isPending] = useActionState(save, { ok: false });

return (
  <form action={formAction}>
    <input name="name" />
    <button disabled={isPending}>Save</button>
    {state.error && <p>{state.error}</p>}
  </form>
);
```

Unlike `useFormStatus`, `isPending` is available in the component that owns the form. The third argument, `permalink`, is the URL used for progressive enhancement when JavaScript has not loaded yet. The state you return should be serializable if this action runs on the server.

Use it when the form needs to show a result or an error from the action. A button that only needs `pending` can stay on `useFormStatus`.

---

## `useOptimistic`

`useOptimistic` shows a temporary value while an action or transition is in flight, then snaps back to the source of truth.

```jsx
const [optimisticName, setOptimisticName] = useOptimistic(name);

async function submit(formData) {
  const next = formData.get("name");
  setOptimisticName(next);
  await updateName(next);
}
```

During the transition, `optimisticName` is `next`. When `updateName` finishes, the hook returns `name` again, which should already be the saved value if the parent re-rendered from fresh props or cache. If the request failed and `name` did not change, the UI rolls back by itself.

The setter must run inside a transition or an action. Called from a random event with no transition, the optimistic value has no in-flight update to attach to. A reducer form exists when the optimistic update is a list edit rather than a replacement: `useOptimistic(messages, (current, message) => [...current, message])`.

This replaces a pile of `isSaving` booleans for the happy path. You still render the error if the action returns one.

---

## The `use` API

`use(resource)` reads a promise or a context during render.

```jsx
const user = use(userPromise);
const theme = use(ThemeContext);
```

If `userPromise` is pending, the component suspends and the nearest `Suspense` shows its fallback. If it rejects, the nearest error boundary gets the error. `use(context)` is the same read as `useContext`, and it may be called inside an `if`. Other hooks still cannot.

The promise has to be stable across renders. `use(fetch("/api/user"))` starts a new request every render and suspends forever. Cache the promise: a module variable, a router loader, or the framework cache. You do not create it inline in the component body.

`use` is how a client component consumes a promise that a Server Component started and passed down as a prop. The server started the fetch early. The client suspends until that same promise resolves, without a second request and without an effect.

---

## Ref cleanup and ref as a prop in React 19

`ref` is a normal prop on function components. `forwardRef` still works, and new components do not need it.

```jsx
function Input({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}
```

A ref callback may return a cleanup function. React calls that cleanup when the node is detached, before the next attachment, and on unmount.

```jsx
<input
  ref={(node) => {
    const observer = new ResizeObserver(onResize);
    observer.observe(node);
    return () => observer.disconnect();
  }}
/>
```

Previously the callback was called with `null` on detach and you cleaned up in that branch. The cleanup function is the replacement. Return nothing unless you are returning that function. An implicit return of the node (`ref={(node) => (el = node)}`) is not a cleanup. Use a block body.

Callback refs run after commit, when the DOM node exists. Do not measure layout during render and stash it in a ref as a substitute. `useLayoutEffect` remains the place for a measurement that must happen before paint.
