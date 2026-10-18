# JavaScript Interview Study Guide: Asynchronous JavaScript - very important

Concise, answer-first explanations you can say aloud in an interview. Use the examples when the interviewer asks you to go deeper.

---

## Call Stack, Web APIs, and the Task Queue

### What are the Call Stack, Web APIs, and the Task Queue?

**JavaScript on a page runs on one main thread with a call stack. The stack is LIFO: the currently running function is on top, and it must finish before the one below it continues.**

**Web APIs** (timers, `fetch`, DOM events, `queueMicrotask`, and so on) are provided by the host (the browser or Node). When you call `setTimeout` or `fetch`, JS only _schedules_ work. The host does the wait or the I/O **outside** the stack.

When that work is ready, the host puts a **callback** into a queue. The **event loop** later takes it off the queue and runs it on the call stack, but only when the stack is empty.

```javascript
console.log("A");

setTimeout(() => console.log("B"), 0);

Promise.resolve().then(() => console.log("C"));

console.log("D");
// A, D, C, B
```

`A` and `D` run on the current stack. `C` is a **microtask**. `B` is a **macrotask** (timer), so it runs after microtasks.

Say this in an interview: **JS is single-threaded; async is scheduling, not multithreading.**

---

## Event Loop

### What is the event loop?

The **event loop** is the host’s scheduler (browser or Node). JavaScript itself only runs whatever is currently on the **call stack**. The loop’s job is: _when the stack is empty, pick the next piece of scheduled work and put it on the stack._

It does **not** run JS in parallel. It only decides **what runs next** after the current synchronous work finishes.

### How are the pieces connected?

```text
  ┌─────────────────────────────────────────────────────────┐
  │                      Call Stack                         │
  │         (synchronous JS: currently running)             │
  └──────────────────────────▲──────────────────────────────┘
                             │  event loop pushes a callback
                             │  only when the stack is empty
         ┌───────────────────┴───────────────────┐
         │                                       │
  ┌──────┴──────────┐                   ┌────────┴─────────┐
  │  Microtask      │  drain ALL        │  Macrotask       │
  │  queue          │  before next      │  (task) queue    │
  │  Promises,      │  macrotask        │  timers, I/O,    │
  │  queueMicrotask │                   │  click, message  │
  └────────▲────────┘                   └────────▲─────────┘
           │ enqueue                             │ enqueue
  ┌────────┴─────────────────────────────────────┴─────────┐
  │                      Web APIs / host                    │
  │         setTimeout, fetch, DOM events, …                │
  └─────────────────────────────────────────────────────────┘
```

1. Your script runs on the **call stack** (`main`).
2. `setTimeout`, `fetch`, `addEventListener` only **register** work with **Web APIs**. The timer/network/DOM lives in the host, not on the stack.
3. When the host is done, it **enqueues a callback**:

- Promise reactions → **microtask queue**
- timer / click / `postMessage` / most I/O → **macrotask (task) queue**

4. The **event loop** waits until the stack is empty, then:

- empties **microtasks**
- may **paint / run** `requestAnimationFrame` (browser)
- takes **one macrotask**, runs it (that becomes the new “current script”)
- repeats

### How does one event-loop turn look?

A useful browser mental model (HTML event loop, slightly simplified):

1. Run the current task until the **call stack is empty**.
2. **Checkpoint:** drain the **microtask queue to empty**. If a microtask queues another microtask, that one runs in the same drain. Rendering and timers wait.
3. If the browser needs a frame: run `requestAnimationFrame` callbacks, then **style / layout / paint**.
4. Pick the **oldest macrotask** from the chosen task source (timer, user interaction, networking, …) and run it.
5. Go back to step 2.

The loop **never** injects another task into a function that is already running. A tight `while (true) {}` freezes the UI: the stack never empties, so no timers, clicks, promise callbacks, or paint can happen.

Node has extra queues (`process.nextTick`, `setImmediate`, several I/O phases). Same idea: **stack empty → drain nextTick/microtasks → next phase**. Mention Node phases only if the interview is Node-heavy.

### Walk through a classic example

```javascript
console.log("script start");

setTimeout(() => console.log("timeout"), 0); // 4

Promise.resolve().then(() => {
  console.log("promise 1");
  Promise.resolve().then(() => console.log("promise 2"));
});

console.log("script end");
```

What the loop does:

1. **Macrotask** `script`**:** log `script start`. `setTimeout` hands a timer to Web APIs. `Promise.resolve().then` **enqueues** `promise 1` as a microtask. Log `script end`. Stack empty.
2. **Drain microtasks:** run `promise 1`. That callback **enqueues** `promise 2`. The drain continues, so `promise 2` runs **before** any timer. Microtask queue empty.
3. **Next macrotask:** the timer callback logs `timeout`.

Output: `script start` → `script end` → `promise 1` → `promise 2` → `timeout`.

### How does this relate to rendering and “jank”?

After microtasks, the browser **may** paint. A long macrotask (huge loop, expensive JSON parse, heavy React commit) blocks input and frames until it returns. That is **jank**.

A chain of microtasks that never ends (`queueMicrotask` in a loop, or an infinite `then`) **starves** rendering and macrotasks the same way: paint waits for the microtask checkpoint to finish.

Split heavy work with `setTimeout(0)`, `scheduler.postTask`, or `requestIdleCallback` so other tasks and frames can run.

### Why can a `0ms` `setTimeout` still run “late”?

`setTimeout(fn, 0)` means “put `fn` on the timer task queue after at least 0 ms.” It still waits for:

- the current stack to finish
- **all microtasks** to drain
- any earlier macrotasks
- browser minimum timer clamping (often ~4 ms nested timers in browsers)

**So** `0` **is a lower bound, not a guarantee. - impiortant**

---

## Microtasks and Macrotasks

### What is the difference between microtasks and macrotasks?

|                 | Microtasks                                                                                        | Macrotasks (tasks)                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Typical sources | `Promise.then` / `catch` / `finally`, `queueMicrotask`, `MutationObserver`, `await` continuations | `setTimeout`, `setInterval`, `setImmediate` (Node), I/O, UI events, `postMessage`, `requestAnimationFrame` (often treated separately) |
| When they run   | After the current stack, **before** the next macrotask                                            | One (or a batch, depending on the host) **after** microtasks                                                                          |
| Risk            | Starvation: an endless `.then` chain never yields to timers or paint                              | UI delay if a task is too long                                                                                                        |

```javascript
setTimeout(() => console.log("macro"));

Promise.resolve()
  .then(() => console.log("micro 1"))
  .then(() => console.log("micro 2"));

queueMicrotask(() => console.log("micro 3"));
// micro 1, micro 3, micro 2, macro
```

Order among microtasks is FIFO of the microtask queue. Chained `.then` callbacks are new microtasks, so they interleave with other microtasks already queued.

### Does `async/await` use microtasks?

Yes. After an `await`, the rest of the function is scheduled as a **microtask** (same as a promise continuation).

```javascript
async function f() {
  console.log(1);
  await null; // equivalent to waiting on Promise.resolve(null)
  console.log(2);
}
f();
console.log(3);
// 1, 3, 2
```

---

## Promises: States and Chains

### What states can a Promise have?

A promise is a **one-shot** state machine:

- **pending** — not settled yet
- **fulfilled** — settled with a value (`resolve`)
- **rejected** — settled with a reason (`reject`)

Settling is **final**. A second `resolve`/`reject` is ignored.

```javascript
const p = new Promise((resolve, reject) => {
  resolve(1); // return return 1
  reject(new Error("no")); // ignored return -1
});
```

### How do `.then`, `.catch`, and `.finally` chains work?

Each `.then` / `.catch` / `.finally` **returns a new promise**.

- If the handler returns a value, the next promise **fulfills** with that value.
- If the handler throws, the next promise **rejects**.
- If the handler returns a promise, the next promise **adopts** its state (flattening).

```javascript
Promise.resolve(1)
  .then((n) => n + 1)
  .then((n) => {
    throw new Error("boom");
  })
  .catch((err) => {
    console.log(err.message); // boom
    return 42;
  })
  .then((n) => console.log(n)); // 42
```

`.catch` is `.then(undefined, onRejected)`. After a catch that returns a value, the chain is **fulfilled** again.

`.finally` runs on fulfill or reject, does not receive the value, and **re-throws / re-passes** the original settlement unless the `finally` handler itself throws or returns a rejected promise.

### What is the difference between `resolve(value)` and `resolve(otherPromise)`?

`resolve(otherPromise)` **ties** this promise to `otherPromise`. The outer promise waits and copies the inner outcome. That is how thenables flatten.

### What happens if you omit `.catch`?

An unhandled rejection. In browsers you get `unhandledrejection`; in Node it can crash the process depending on version and flags. Always attach error handling at the end of a chain, or use `async/await` with `try/catch`.

---

## `Promise.all`, `allSettled`, `race`, and `any`

### When should you use each combinator?

All of them take an **iterable** of promises (or values, which are wrapped with `Promise.resolve`).

`Promise.all(iterable)`

- Fulfills with an **array of values in input order** when **every** promise fulfills.
- Rejects **as soon as the first** promise rejects (fail-fast). Other requests may still complete in the background.

```javascript
const [user, posts] = await Promise.all([fetchUser(), fetchPosts()]);
```

`Promise.allSettled(iterable)`

- Always fulfills (never rejects from the input promises).
- Result is `{ status: "fulfilled", value }` or `{ status: "rejected", reason }` per item.
- Use when you want **every outcome**, for example several independent widgets.

`Promise.race(iterable)`

- Settles with **whatever settles first**, fulfill or reject.
- Classic uses: timeout wrapper, “first of two sources.”

```javascript
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("timeout")), ms);
  });
  return Promise.race([promise, timeout]);
}
```

Racing a timeout **does not cancel** the original `fetch` unless you also use `AbortController`.

`Promise.any(iterable)`

- Fulfills with the **first fulfillment**.
- Rejects only if **all** reject, with an `AggregateError`.
- Use for “first successful mirror / fallback endpoint.”

| Method       | Succeeds when    | Fails when                          |
| ------------ | ---------------- | ----------------------------------- |
| `all`        | all fulfill      | first reject                        |
| `allSettled` | all have settled | (doesn't reject for input failures) |
| `race`       | first settlement | first settlement if it is a reject  |
| `any`        | first fulfill    | all reject                          |

### When would you actually use each one?

`Promise.all` **— you need every result, and one failure should fail the whole operation.**

Dashboard that cannot render without both chunks: user **and** permissions. A product page that needs product + price + stock together. Parallel independent GETs that are still part of **one** transaction from the UI’s point of view.

```javascript
const [product, price, stock] = await Promise.all([
  fetchProduct(id),
  fetchPrice(id),
  fetchStock(id),
]);
renderPage({ product, price, stock });
```

Do **not** use `all` for “load five widgets, show whichever work.” One 500 blanks the whole page.

`Promise.allSettled` **— you want every outcome; successes and failures are independent.**

Home screen widgets (weather, notifications, ads). Sending a batch of emails/pushes and reporting which ids failed. Health checks against many services. “Save all form rows, then show a per-row error.”

```javascript
const settled = await Promise.allSettled(
  widgetIds.map((id) => fetchWidget(id)),
);

const widgets = settled
  .filter((r) => r.status === "fulfilled")
  .map((r) => r.value);

const failed = settled
  .filter((r) => r.status === "rejected")
  .map((r) => r.reason);

renderWidgets(widgets);
if (failed.length) showPartialError(failed);
```

`Promise.race` **— the first settlement wins, even if that settlement is a rejection.**

Timeout around a slow `fetch` (pair with `AbortController` so the request actually stops). “First of two sources” when **either** success **or** failure of the fastest one should decide: first click vs a cancel timer, first websocket message vs a connect timeout.

```javascript
async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);

  try {
    return await Promise.race([
      fetch(url, { signal: controller.signal }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), ms),
      ),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}
```

If a cached (fast) request **rejects**, `race` rejects even if a slower network request would have succeeded. That is the difference from `any`.

`Promise.any` **— you need one success; failures are ignorable until all have failed.**

CDN / API **mirrors**: hit three hosts, use the first 200. Feature detection that tries WebGL, then canvas, then a static image. “Primary auth provider, else fallback provider” when a reject from the primary should not abort the fallback.

```javascript
const res = await Promise.any([
  fetch("https://cdn-eu.example.com/file"),
  fetch("https://cdn-us.example.com/file"),
  fetch("https://origin.example.com/file"),
]);
```

If EU is down and US is slow but OK, `any` returns US. `race` might reject as soon as EU fails.

Interview one-liner: `all` **= all must succeed;** `allSettled` **= wait for all, inspect each;** `race` **= fastest settle (win or lose);** `any` **= fastest success.**

---

## `async` / `await` and Error Handling

### How does `async/await` relate to Promises?

`async` functions **always return a Promise**. `return x` fulfills with `x`. `throw err` rejects with `err`. `await p` pauses the async function until `p` settles, then resumes as a microtask. The **call stack of the caller is not blocked**; only that async function’s execution is suspended.

```javascript
async function load() {
  const res = await fetch("/api");
  if (!res.ok) throw new Error(res.status);
  return res.json();
}
```

This is equivalent to a `.then` chain, but easier to read for sequential steps.

### How do you handle errors with `async/await`?

Use `try/catch/finally` around `await`. One `try` can cover several sequential awaits.

```javascript
async function load() {
  try {
    const a = await fetchA();
    const b = await fetchB(a);
    return b;
  } catch (err) {
    console.error(err);
    throw err; // rethrow if the caller should handle it
  } finally {
    // cleanup, loading spinner, etc.
  }
}
```

Forgetting `await` is a common bug: you get a Promise, not the value, and `try/catch` will **not** catch a later rejection unless that Promise is awaited or has `.catch`.

```javascript
try {
  fetch("/x"); // not awaited — rejection is unhandled
} catch (e) {
  // does not run for the fetch failure
}
```

### How do you retry a failed request?

Retry **idempotent** calls (usually GET) with a limit and backoff. Do not blindly retry POST without knowing the server semantics.

```javascript
async function fetchWithRetry(url, { attempts = 3, delayMs = 300 } = {}) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs * 2 ** i));
      }
    }
  }
  throw lastError;
}
```

Interview follow-up: retry on network errors and 429/503, not on 400/404. Jitter avoids thundering herds.

---

## Sequential vs Concurrent Requests

### How do you run requests one after another vs in parallel?

**Sequential:** each `await` waits for the previous one. Use when request B **needs** A's result, or when you must limit load.

```javascript
const a = await fetchA();
const b = await fetchB(a.id);
```

**Concurrent (parallel at the network level):** start all promises **without** awaiting in between, then `await Promise.all`.

```javascript
const userPromise = fetchUser();
const postsPromise = fetchPosts();
const [user, posts] = await Promise.all([userPromise, postsPromise]);
```

A classic footgun:

```javascript
// accidentally sequential — slower
const user = await fetchUser();
const posts = await fetchPosts();
```

`Promise.all` concurrency is **not** worker threads. The main thread still processes callbacks one at a time; the **I/O waits overlap**.

### How do you limit concurrency (pool)?

If you have 100 URLs, do not `Promise.all` all of them. Process a window of N in flight (a simple loop with a pool, or a library). Interviewers want to hear **backpressure** and **rate limits**.

---

## `AbortController` and Cancelling Requests

### How does `AbortController` work?

`AbortController` is a **signal** you pass into APIs that support cancellation (`fetch`, some streams, `addEventListener` with `{ signal }`).

```javascript
const controller = new AbortController();
const { signal } = controller;

const promise = fetch("/api", { signal });

controller.abort(); // or abort(new DOMException("...", "AbortError"))

try {
  await promise;
} catch (err) {
  if (err.name === "AbortError") {
    // user navigated away, new search started, etc.
    return;
  }
  throw err;
}
```

Aborting **does not undo** work the server already did; it stops the **client** from waiting and lets the browser stop the connection when it can.

Pass the **same signal** into retries if the user cancelled the whole operation.

Timeouts:

```javascript
await fetch(url, { signal: AbortSignal.timeout(5000) });
```

Or combine signals with `AbortSignal.any([userSignal, timeoutSignal])` where supported.

---

## Timers: `setTimeout` and `setInterval`

### How do `setTimeout` and `setInterval` work?

Both are **macrotasks**. The delay is a **minimum**. Callbacks run on the event loop when the stack is free.

```javascript
const id = setTimeout(() => {}, 1000);
clearTimeout(id);

const intervalId = setInterval(() => {}, 1000);
clearInterval(intervalId);
```

Always **clear** timers on unmount / navigation. Uncleared intervals are a common leak.

### Why is `setInterval` often replaced by recursive `setTimeout`?

`setInterval` schedules the next tick **from the interval start**, even if the callback is still running. If the callback takes longer than the interval, ticks can **overlap in intent** (in the browser the next interval callback still waits for the previous to finish on the single thread, but they **pile up** as queued tasks). Recursive `setTimeout` schedules the next run **after** the work finishes, so you get spacing you control:

```javascript
let timer;
function tick() {
  // work...
  timer = setTimeout(tick, 1000);
}
tick();
```

`setTimeout` / `setInterval` delay is specified as a 32-bit signed int in HTML; very large delays can overflow.

In Node, `setImmediate` and `process.nextTick` are extra queues (`nextTick` is even more eager than microtasks in Node’s model). Mention Node only if the interview is Node-heavy.

---

## Debounce and Throttle ( repeat)

### What is debounce vs throttle?

Both **rate-limit** how often a function runs.

**Debounce:** wait until the events **stop** for `wait` ms, then run once. Search-as-you-type, resize end, form autosave.

**Throttle:** run **at most once** per `wait` ms while events keep firing. Scroll position, pointer move, “how far have we scrolled.”

```javascript
function debounce(fn, wait) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait); // 300 ,  500
  };
}

function throttle(fn, wait) {
  //  300 ..500
  let last = 0;
  let timer;
  return function (...args) {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      last = now;
      fn.apply(this, args);
    } else {
      clearTimeout(timer);
      timer = setTimeout(() => {
        last = Date.now();
        fn.apply(this, args);
      }, remaining);
    }
  };
}
```

Interview extras:

- Leading vs trailing edge (run immediately, then ignore vs run after quiet period).
- Cancel on unmount (`clearTimeout`) so a stale call does not `setState` on an unmounted component.
- For scrolling, `requestAnimationFrame` is sometimes a better throttle than a timer.

---

## Race Conditions and Stale Responses

### What is an async race condition in the UI?

The user triggers request A, then request B. **B’s response can arrive first.** If you always apply the latest HTTP response by arrival time, you might show **A’s data after B**, which is stale.

This is not a data-race on memory like in C++; it is **out-of-order completion**.

### How do you ignore stale responses?

**1. Ignore outdated generations** (request id / monotonic counter):

```javascript
let requestId = 0;

async function search(query) {
  const id = ++requestId;
  const data = await fetchSearch(query);
  if (id !== requestId) return; // a newer search exists
  render(data);
}
```

**2. Abort the previous request** with `AbortController` (preferred with `fetch`):

```javascript
let controller;

async function search(query) {
  controller?.abort();
  controller = new AbortController();
  try {
    const data = await fetchSearch(query, { signal: controller.signal });
    render(data);
  } catch (err) {
    if (err.name === "AbortError") return;
    throw err;
  }
}
```

**3. Sequence numbers on the server** or ETags, if two writes can overlap.

**4. Disable the control** until the request finishes — crude but valid for some forms.

React 18+ `useTransition` / libraries like React Query handle much of this; still be able to explain the **generation or abort** idea.

---

## Async Iterators and Streams

### What are async iterators?

An object with `[Symbol.asyncIterator]()` that returns an iterator whose `next()` returns a **Promise** of `{ value, done }`. `for await (const chunk of source)` consumes it.

Use cases: paginated APIs, file reads in Node, `ReadableStream` readers.

```javascript
async function* pages(url) {
  let next = url;
  while (next) {
    const res = await fetch(next);
    const data = await res.json();
    yield data.items;
    next = data.nextUrl;
  }
}

for await (const items of pages("/api?page=1")) {
  render(items);
}
```

### How do Web Streams relate to this?

`fetch` bodies are `ReadableStream`s. You can process bytes as they arrive instead of buffering the whole payload. `AbortSignal` can cancel the reader. This matters for large downloads and backpressure.

---

## Must-Explain Questions

### Why does JavaScript need an event loop if it is single-threaded?

So the thread can **do other work** (or stay idle for paint/input) while I/O and timers complete in the host. Async is **non-blocking scheduling**, not parallel JS execution on the main thread.

### What is printed and why?

```javascript
console.log("start");

setTimeout(() => console.log("timeout"), 0);

Promise.resolve()
  .then(() => console.log("then 1"))
  .then(() => console.log("then 2"));

async function a() {
  console.log("async start");
  await Promise.resolve();
  console.log("async after await");
}
a();

console.log("end");
```

Expected order:

1. `start`
2. `async start` (`a()` runs until the first `await`)
3. `end`
4. `then 1` and `async after await` (both microtasks; relative order depends on which was queued first — `a()`’s await schedules after `Promise.resolve().then`, so typically `then 1`, then `async after await`, then `then 2`)
5. `timeout`

Be ready to walk the queues; interviewers care about the **method**, not memorizing one snippet.

### Does `Promise.all` cancel the others on failure?

No. Remaining fetches keep running unless you abort them yourself.

### Is `await` blocking?

It blocks **that async function’s continuation**, not the main thread and not other event-loop work.

### How do you timeout `fetch` correctly?

`AbortSignal.timeout` or `AbortController` plus `setTimeout` that calls `abort()`. `Promise.race` with a rejecting timer without abort leaves the network request alive.

---

## Practice

Hands-on tasks: [practice/](practice/README.md).
