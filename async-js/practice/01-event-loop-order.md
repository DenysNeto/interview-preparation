# Practice: Event-loop output order

For each snippet, write the logs **in order** (and skip the snippet if you want a harder pass: only look at the answer after you run it).

Run any snippet with Node: paste into a file or `node -e '...'`.

---

## 1. Script, timeout, promise

```javascript
console.log("A");

setTimeout(() => console.log("B"), 0);

Promise.resolve().then(() => console.log("C"));

console.log("D");
```

Your order:

---

## 2. Nested microtasks vs one macrotask

```javascript
console.log("start");

setTimeout(() => {
  console.log("timeout");
  Promise.resolve().then(() => console.log("timeout then"));
}, 0);

Promise.resolve()
  .then(() => {
    console.log("then 1");
    return Promise.resolve();
  })
  .then(() => console.log("then 2"));

console.log("end");
```

Your order:

---

## 3. `async` / `await` vs `.then`

```javascript
console.log(1);

async function foo() {
  console.log(2);
  await Promise.resolve();
  console.log(3);
}

foo();

Promise.resolve().then(() => console.log(4));

console.log(5);
```

Your order:

---

## 4. `Promise.all` vs a later timeout

```javascript
setTimeout(() => console.log("T"), 0);

Promise.all([
  Promise.resolve("a"),
  Promise.resolve("b"),
]).then((values) => console.log(values.join(",")));

queueMicrotask(() => console.log("M"));
```

Your order:

---

## 5. Rejection and catch (still microtasks)

```javascript
console.log("go");

Promise.reject(new Error("x"))
  .catch(() => console.log("caught"))
  .then(() => console.log("after catch"));

setTimeout(() => console.log("later"), 0);

console.log("done");
```

Your order:

---

## Answers

1. `A`, `D`, `C`, `B`  
   Sync first. `C` is a microtask. `B` is a timer macrotask.

2. `start`, `end`, `then 1`, `then 2`, `timeout`, `timeout then`  
   Both `.then` callbacks drain before the timer. The promise scheduled **inside** the timeout runs as a microtask **after that timeout task**, before the next macrotask.

3. `1`, `2`, `5`, `3`, `4`  
   `foo()` runs until `await`. Continuations of `await` and `.then` are microtasks. `await Promise.resolve()` queues `foo`’s resume **before** the later `Promise.resolve().then(() => 4)` in typical engines, so `3` then `4`. If you ever see `4` then `3`, walk the queue instead of memorizing one engine.

4. `M`, `a,b`, `T`  
   `queueMicrotask` and `Promise.all`’s `.then` are microtasks; the timeout is a macrotask. `M` was queued first.

5. `go`, `done`, `caught`, `after catch`, `later`  
   `catch` / following `then` are microtasks. The timer waits.
