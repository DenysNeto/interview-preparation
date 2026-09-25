# JavaScript Interview Study Guide: Language Fundamentals

Concise, answer-first explanations you can say aloud in an interview. Use the examples when the interviewer asks you to go deeper.

---

## Data Types: Primitive vs. Reference

### What is the difference between primitive and reference types?

Primitives—`string`, `number`, `boolean`, `null`, `undefined`, `symbol`, and `bigint`—are copied by value.

For objects, arrays, and functions, the **reference value is copied**. Both variables then point to the same object; the object itself is not copied.

```javascript
let a = 1;
let b = a;
b = 2; // a is still 1

const x = { n: 1 };
const y = x;
y.n = 2; // x.n is 2
```

---

## Type Coercion: Explicit vs. Implicit

### What is the difference between explicit and implicit coercion?

- **Explicit coercion:** You intentionally convert a value, such as `Number("42")`, `String(1)`, or `Boolean("")`.
- **Implicit coercion:** The engine converts a value for you, such as `"5" + 1` → `"51"`, `"5" - 1` → `4`, or `if (obj)`.

Prefer explicit conversion in production code.

---

## Comparison: `==`, `===`, and `Object.is`

### How do `==`, `===`, and `Object.is` differ?

- **`===`:** Compares type and value without coercion.
- **`==`:** Coerces types before comparing. For example, `0 == false` is `true`. Avoid it in most code.
- **`Object.is`:** Mostly behaves like `===`, but `Object.is(NaN, NaN)` is `true`, and `Object.is(+0, -0)` is `false`.

---

## Truthy and Falsy Values

### What values are falsy?

The falsy values are:

- `false`
- `0`
- `-0`
- `0n`
- `""`
- `null`
- `undefined`
- `NaN`

Everything else is truthy, including `[]`, `{}`, and `"0"`.

---

## `var`, `let`, and `const`

### How do `var`, `let`, and `const` differ?

- **`var`**
  - Scope: function
  - Can be reassigned: yes
  - Can be redeclared in the same scope: yes
- **`let`**
  - Scope: block
  - Can be reassigned: yes
  - Can be redeclared in the same scope: no
- **`const`**
  - Scope: block
  - Can be reassigned: no
  - Can be redeclared in the same scope: no

`const` prevents reassignment of the binding, but it still allows mutation of object contents. Prefer `const`, then `let`. Do not use `var` in modern code.

---

## Hoisting and the Temporal Dead Zone

### What are hoisting and the Temporal Dead Zone?

JavaScript processes declarations before executing code.

- `var` is hoisted and initialized to `undefined`.
- `let` and `const` are hoisted but remain uninitialized in the **Temporal Dead Zone (TDZ)** until their declaration executes. Accessing them earlier throws a `ReferenceError`.
- Function declarations are fully hoisted with both their name and body.

### How does the Temporal Dead Zone work?

The TDZ lasts from **entering a scope** until the `let`, `const`, or `class` declaration **runs**. The binding already exists and shadows an outer variable with the same name, but it is uninitialized. Reading from or writing to it during that window throws a `ReferenceError`.

The TDZ is not a special JavaScript object. It is a language rule: the variable is in scope but is not ready to use.

```javascript
console.log(a); // undefined — var is hoisted and initialized
var a = 1;

console.log(b); // ReferenceError — TDZ
let b = 2;
```

#### Why is `typeof` not always safe?

`typeof` on an undeclared identifier returns `"undefined"`, but `typeof` on a binding in the TDZ still throws.

```javascript
typeof missing; // "undefined"
typeof x;       // ReferenceError
let x = 1;
```

#### When does shadowing begin?

Shadowing begins at the start of the block, not at the `let` declaration. This fails even though `value` exists in the outer scope:

```javascript
const value = "outer";

{
  console.log(value); // ReferenceError — inner `value` is already in TDZ
  const value = "inner";
}
```

#### Does `const` have a TDZ?

Yes. A `const` binding must be initialized in its declaration, but its TDZ still lasts until that declaration executes, including inside loops and conditional blocks.

#### Are classes in the TDZ?

Yes. Class declarations cannot be accessed before their declaration executes.

```javascript
const p = new Person(); // ReferenceError
class Person {}
```

#### How can default parameters encounter the TDZ?

Later parameters are still uninitialized while earlier default parameters are being evaluated.

```javascript
function f(a = b, b = 2) {
  // accessing `b` while initializing `a` → ReferenceError
}
f();
```

#### How can closures or callbacks encounter the TDZ?

A closure can access the binding only after it has been initialized. Calling the closure too early throws.

```javascript
function setup() {
  cb(); // if cb runs now, `x` is still in TDZ
  let x = 1;
  function cb() {
    console.log(x);
  }
  return cb; // later calls are fine
}
```

> **Interview one-liner:** `let` and `const` are hoisted, but unlike `var`, they are not initialized. From scope entry until initialization, they are in the TDZ, and any access throws. This catches bugs that `var` would hide with `undefined`.

---

## Lexical Environment and Scope Chain

### How does the scope chain work?

A function remembers the **lexical environment where it was defined**, not where it is called. Identifier lookup proceeds from the local scope to each outer scope and finally to the global scope. Closures use this chain.

---

## Closures: Uses and Common Mistakes

### What does a closure capture, and when is it useful?

A closure captures variables from its outer lexical environment as **live bindings**, not snapshots of their values.

Common uses include:

- Private state
- Factories
- Event handlers
- Memoization

A common bug occurs when a loop uses `var`: every callback shares the same `i` binding. Use `let`, which creates a new binding for each iteration, or use an IIFE.

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0); // 3, 3, 3
}

for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0); // 0, 1, 2
}
```

---

## `this`

### How does `this` work depending on how a function is called?

For regular functions, the call site determines `this`:

- **Method call:** `obj.fn()` → `this` is `obj`.
- **Bare call:** `fn()` → `this` is `undefined` in strict mode and `window` in non-strict browser scripts.
- **Constructor call:** `new Fn()` → `this` is the new instance.
- **`call`, `apply`, or `bind`:** You explicitly set `this`.
- **Arrow function:** It has no own `this`; it uses `this` from the enclosing lexical scope.
- **DOM handler using a classic function:** `this` is the element.

---

## `bind`, `call`, and `apply`

### What is the difference between `call`, `apply`, and `bind`?

All three let you set `this`, but they differ in invocation and argument handling:

- `call(thisArg, a, b)` invokes the function immediately with arguments listed individually.
- `apply(thisArg, [a, b])` invokes the function immediately with arguments in an array or array-like object.
- `bind(thisArg, a)` returns a new function with `this` and, optionally, initial arguments fixed.

---

## Arrow Functions vs. Regular Functions

### How do arrow functions differ from regular functions?

Arrow functions have no own `this`, `arguments`, or `prototype`, and they cannot be called with `new`. They inherit `this` from the surrounding lexical scope.

Regular functions receive `this` according to how they are called.

---

## Prototypes, Classes, and Inheritance

### How does the prototype chain work?

Property lookup follows this order: own properties → `[[Prototype]]` → the next prototype → … → `null`.

Classes are syntax over constructors and prototypes. `extends` establishes inheritance through the prototype chain, and `super` accesses or calls the parent implementation.

```javascript
class Animal {
  speak() { return "sound"; }
}
class Dog extends Animal {
  speak() { return super.speak() + " bark"; }
}
```

---

## Property Descriptors

### What can a property descriptor control?

A property descriptor can define:

- Data properties: `value` and `writable`
- Shared flags: `enumerable` and `configurable`
- Accessor properties: `get` and `set`

Use `Object.defineProperty` to set descriptors. `Object.freeze` and `Object.seal` also work by changing descriptor flags.

---

## Spread, Rest, and Destructuring

### What is the difference between spread and rest?

- **Spread** expands values: `{ ...obj }`, `[...arr]`, or `fn(...args)`.
- **Rest** collects values: `function f(...args)` or `const { a, ...rest } = obj`.

Destructuring unpacks values into variables and supports defaults and renaming:

```javascript
const { name: n = "anon" } = user;
```

---

## Optional Chaining and Nullish Coalescing

### When do you use `?.` and `??`?

- `obj?.a?.b` stops and returns `undefined` if the value on the left of `?.` is `null` or `undefined`.
- `a ?? b` uses `b` only when `a` is `null` or `undefined`, not when `a` is `0` or `""`.

Do not mix `??` with `||` or `&&` without parentheses.

---

## `Symbol`, `Map`, `Set`, `WeakMap`, and `WeakSet`

### When would you use these types?

- **`Symbol`:** Unique property keys that most common enumeration methods skip.
- **`Map`:** Key-value storage with keys of any type and guaranteed insertion order.
- **`Set`:** Storage for unique values.
- **`WeakMap` and `WeakSet`:** Weak associations with objects that do not prevent garbage collection. They are useful for metadata that should not cause memory leaks.

### What is a `Symbol`?

A `Symbol` is a primitive. Every call to `Symbol()` creates a unique value, even when the same description is used:

```javascript
Symbol("id") === Symbol("id"); // false
```

Object string keys can collide—for example, when two libraries both use `obj.id`. A symbol key does not clash with the string key `"id"`.

```javascript
const ID = Symbol("id");
const user = { name: "Ann", [ID]: 42 };

user.id;           // undefined (different key)
user[ID];          // 42
Object.keys(user); // ["name"] — symbol is skipped
```

Symbols are not fully hidden. `Object.getOwnPropertySymbols(user)` and `Reflect.ownKeys(user)` can retrieve them. `JSON.stringify` ignores symbol-keyed properties.

**Well-known symbols** hook into language behavior:

- `Symbol.iterator` controls what `for...of` uses.
- `Symbol.toStringTag` customizes an object's default string tag.
- `Symbol.toPrimitive` controls primitive conversion.

`Symbol.for("key")` uses the global symbol registry, so the same key returns the same symbol across the application. Plain `Symbol()` always returns a unique symbol.

> **Interview one-liner:** A symbol is a unique, non-string property key. Use it for metadata or library fields that must not collide with user properties.

### How does a `Map` differ from an object?

An object can use only strings and symbols as property keys; for example, `obj[1]` becomes `obj["1"]`. A `Map` can use any value as a key, including objects, functions, and `NaN`.

```javascript
const map = new Map();
const el = { id: 1 };
map.set(el, "meta");
map.get(el); // "meta" — lookup by the same object reference
```

Additional `Map` characteristics:

- Insertion order is guaranteed.
- `.size` provides the number of entries directly and is constant-time in standard implementations.
- Frequent additions and deletions are clearer than `delete obj[key]`.
- You can iterate with `map.keys()`, `map.values()`, `map.entries()`, or `for...of`.

Use an object for a simple record such as `user.name`. Use a `Map` when keys are objects, key types must remain unchanged, or you need a dedicated dictionary API.

### What is a `Set`?

A `Set` stores unique values using SameValueZero equality, which behaves like `===` except that `NaN` equals `NaN`.

```javascript
const s = new Set([1, 1, 2]);
s.size;        // 2
s.has(1);      // true
[...s];        // [1, 2] — unique + original order
```

Typical uses include:

- Deduplicating an array
- Fast membership checks with `has`
- Tracking unique objects by reference

A `Set` has no “get by value” operation; use `has`, `add`, and `delete`. Use a `Map` when you need key-value associations.

### How do `WeakMap` and `WeakSet` work?

#### Простыми словами

Обычный `Map` / `Set` держит **сильную ссылку** на объект. Пока коллекция жива, сборщик мусора **не удалит** этот объект — даже если в остальном коде на него уже никто не смотрит. Это частая причина утечек: «положили DOM-узел в `Map` и забыли `delete`».

`WeakMap` и `WeakSet` держат **слабую ссылку** на объект-ключ (или объект в сете). Слабая ссылка **не считается** причиной оставить объект в памяти. Если больше нигде нет обычных ссылок, объект **могут собрать**, а запись из weak-коллекции **исчезнет сама**. Вам не нужно вызывать `delete`, когда узел убрали из DOM.

Аналогия: `Map` — наклейка на вещи, которую вы положили в свой шкаф (шкаф не даёт вещи пропасть). `WeakMap` — наклейка на вещи, которая **висит, только пока вещь существует**; шкаф вещь не удерживает.

#### Чем отличаются друг от друга

| | `WeakMap` | `WeakSet` |
| --- | --- | --- |
| Что хранит | пары **ключ → значение** | только **факт**, что объект есть в множестве |
| Ключ / элемент | только **объект** (или unregistered `symbol` в новых движках), **не** строка/число | то же: только объекты (или такие symbol) |
| Значение | любое (`число`, объект, `undefined`…) | нет отдельного значения, только «да/нет» |
| Методы | `get`, `set`, `has`, `delete` | `add`, `has`, `delete` |

Нельзя: `size`, `forEach`, `keys()`, `for...of`, выгрузить «все ключи». Сборщик мусора мог бы уже удалить часть записей; если бы вы это видели, поведение GC стало бы частью API и записи пришлось бы держать живыми. Поэтому weak-коллекции **неперебираемые**.

```javascript
const meta = new WeakMap();
const seen = new WeakSet();

let el = document.createElement("div");
meta.set(el, { clicks: 0 }); // ключ — объект el
seen.add(el);

meta.get(el); // { clicks: 0 }
seen.has(el); // true

el = null;
// Если других ссылок на div нет, GC может удалить и div, и запись в meta/seen.
// Когда это случится — не гарантировано и не наблюдаемо через size.
```

Ключом **нельзя** сделать строку:

```javascript
new WeakMap().set("user-1", data); // TypeError — ключ не объект
new Map().set("user-1", data);     // так можно
```

#### Зачем WeakMap

1. **Метаданные на чужом объекте** (DOM-узел, инстанс библиотеки), без продления его жизни:

```javascript
const clicks = new WeakMap();

function onClick(event) {
  const n = event.currentTarget;
  clicks.set(n, (clicks.get(n) ?? 0) + 1);
}
```

Узел удалили из документа и забыли в коде — счётчик не держит узел в памяти.

2. **«Приватные» данные экземпляра** (до `#fields` или вместе с ними, если данные снаружи класса):

```javascript
const priv = new WeakMap();

class Box {
  constructor(secret) {
    priv.set(this, { secret });
  }
  getSecret() {
    return priv.get(this).secret;
  }
}
```

Когда экземпляр больше никому не нужен, исчезнет и `secret`. У обычного `Map` все секреты жили бы, пока жив сам `Map`.

#### Зачем WeakSet

Только «этот объект уже обрабатывали / он в списке», без лишних данных:

```javascript
const processed = new WeakSet();

function process(obj) {
  if (processed.has(obj)) return;
  processed.add(obj);
  // тяжёлая работа один раз на объект
}
```

Когда `obj` собран GC, флаг «уже обработан» уходит вместе с ним. Не нужно чистить множество вручную.

#### Где это используют на практике

В продуктовом UI это не каждый день. Типичные места — **библиотеки, обёртки над DOM, кэш «на объекте»**.

**WeakMap**

1. **Состояние виджета на DOM-узле** — tooltip, popover, «уже повесили listener». Узел исчез из страницы — запись не держит его в памяти. Так делают лёгкие DOM-утилиты, а не `data-*` на каждый чих, если данные большие или не должны светиться в HTML.
2. **Кэш тяжёлого расчёта с ключом-объектом** — `WeakMap<Request, Promise<Response>>`, `WeakMap<объект конфига, нормализованный конфиг>`. Пока жив запрос/конфиг, кэш есть; объект умер — кэш сам ушёл. Не путать с кэшем по URL-строке (там `Map`).
3. **Приватность в библиотеке** — снаружи класса нельзя прочитать поля, если они лежат в module-level `WeakMap`, а не в `this._secret` (это видно). Так писали до `#private`; так всё ещё делают, если данные должны жить **рядом** с инстансом, но в другом модуле.
4. **Связка «объект ↔ побочный ресурс»** — `IntersectionObserver` / `ResizeObserver`: в колбэке приходит `entry.target`, метаданные (колбэк пользователя, опции) достают из `WeakMap`. React / Vue / Angular внутри похожим образом вешают внутренние данные на fiber/vnode/element, не продлевая жизнь узла после unmount.
5. **`WeakRef` + `FinalizationRegistry`** (редко, интервью senior) — WeakMap проще и чаще; WeakRef — когда нужен доступ к объекту, который уже могут собрать.

**WeakSet**

1. **Защита от повторной инициализации** — `init(el) { if (inited.has(el)) return; inited.add(el); ... }` у `querySelectorAll` в SPA: компонент перемонтировали, старый `el` собрали, сет не растёт вечно.
2. **Пометить объекты в графе** (обход JSON со циклами, клонирование): «эту вершину уже видели», без поля `obj.__seen = true`, которое пачкает пользовательский объект.
3. **«Этот listener / этот abort уже подписан»** — множество объектов-подписок, которые сами умирают вместе с владельцем.

**Примеры из «реального мира» (идея, не копипаста API):** jQuery data на элементе исторически была сильной картой и давала утечки; современные обёртки предпочитают weak. В движке JS сами `WeakMap` используют для внутренней метаинформации. В тестах — редко; в админке с `userId: string` — почти никогда, там `Map`.

**На собесе скажите:** «Когда данные принадлежат **чужому объекту** и не должны продлевать ему жизнь: DOM, инстанс либы, дедуп обхода. Если ключ — id в URL или нужно пройтись по всем записям — обычный Map/Set.»

#### Когда НЕ использовать

- Нужен перебор всех записей, `size`, «очистить всё» — берите `Map` / `Set`.
- Ключ — id строкой, число, примитив — только `Map` / `Set` (или объект-обёртка, это почти никогда не нужно).
- Кэш, который вы сами хотите вытеснять по LRU / TTL — weak не даёт политики, только «жив пока жив ключ», и вы не можете пройтись по кэшу.

**Одной фразой на собесе:** WeakMap/WeakSet не мешают GC удалить объект; ключи только объекты; итерировать нельзя — это метаданные «на объекте», а не самостоятельное хранилище.

> **Interview one-liner:** Weak collections do not prevent garbage collection, and you cannot iterate them. Use them for metadata attached to objects you do not own.


### How do objects and collection types compare?

- **Object**
  - Key or value type: string or symbol keys
  - Iterable: not directly; `Object.keys` returns enumerable string keys
  - Prevents garbage collection of referenced keys or values: yes
- **Map**
  - Key or value type: any key
  - Iterable: yes
  - Prevents garbage collection of keys: yes
- **Set**
  - Key or value type: any unique value
  - Iterable: yes
  - Prevents garbage collection of values: yes
- **WeakMap**
  - Key or value type: object keys, plus non-registered symbol keys in newer engines
  - Iterable: no
  - Prevents garbage collection of keys: no
- **WeakSet**
  - Key or value type: object values, plus non-registered symbol values in newer engines
  - Iterable: no
  - Prevents garbage collection of values: no

---

## Iterators and Generators

### What are iterators and generators?

An iterator is an object with a `next()` method that returns `{ value, done }`. The `for...of` loop obtains iterators through `[Symbol.iterator]`.

A generator is declared with `function*`. It pauses at each `yield` and produces an iterator. Generators are useful for lazy sequences and custom iteration.

```javascript
function* ids() {
  yield 1;
  yield 2;
}
```

---

## ECMAScript Modules: `import`, `export`, and Dynamic `import()`

### How do ESM modules work?

Static `import` and `export` declarations are hoisted and expose live bindings. ESM supports both named and default exports.

Dynamic `import()` is asynchronous, returns a `Promise`, and is commonly used for code-splitting. Modules always run in strict mode and have their own scope.

### What does ESM provide?

Each module has its **own scope**, which prevents accidental globals, and always runs in **strict mode**. A module is evaluated **once**; later imports receive the same module instance.

Unlike CommonJS `require`, a static `import` is declarative: the engine or bundler can inspect the dependency graph before running the module. This enables tree-shaking and supports circular-dependency handling.

### How do named exports work?

Named exports let a module expose multiple values whose names are part of its public API.

```javascript
// math.js
export const PI = 3.14;
export function add(a, b) { return a + b; }
export class Calc {}
```

### How do default exports work?

A default export represents one main value from a file, such as a component or page. The importer chooses its local name.

```javascript
// Button.tsx
export default function Button() {}
```

You can mix named and default exports, but teams usually choose one style per file. Prefer named exports for libraries because renaming is explicit and tree-shaking is often clearer. Prefer default exports for React pages or components when that matches the project convention.

### How do re-exports work?

A barrel module can re-export values from other modules.

```javascript
export { add, PI } from "./math.js";
export { default as Button } from "./Button.js";
```

Barrels are convenient, but a large `index.ts` that re-exports everything can hurt tree-shaking.

### How do static imports work?

Static imports support named values, renamed values, default values, namespace objects, and side-effect-only loading.

```javascript
import { add, PI as pi } from "./math.js"; // named + rename
import Button from "./Button.js";          // default
import * as math from "./math.js";         // namespace: math.add
import "./polyfill.js";                    // side effects only
```

Static imports:

- Must appear at the **top level**, not inside `if` or `try`.
- Are **hoisted**: the module is fetched and linked before its code runs.
- Use **explicit paths**. Browsers generally require `.js`; bundlers and TypeScript tooling often resolve omitted extensions.

Use static imports for dependencies always needed by the route or module, such as UI, hooks, and dependencies loaded with the page.

### What are live bindings?

Imported names are **not copied snapshots**. They are live links to bindings in the exporting module. If the exporter later reassigns an exported `let` or `var`, importers observe the new value. An importer cannot assign to an imported binding.

```javascript
// counter.js
export let n = 0;
export function inc() { n += 1; }

// app.js
import { n, inc } from "./counter.js";
inc();
console.log(n); // 1 — live, not a snapshot of 0
```

CommonJS `require` typically exposes the value available at require time or the `module.exports` object. This distinction is especially important in circular dependencies.

### How do circular imports behave?

ESM can often handle circular imports because it links modules before evaluating them and uses live bindings. If module A imports B and B imports A, the cycle works as long as neither module accesses an export before that export has been initialized.

Accessing a still-uninitialized export causes a TDZ-related error.

> **Interview one-liner:** ESM links first and then evaluates; CommonJS executes modules as they are required.

### How does dynamic `import()` work?

Dynamic `import()` is function-like and returns a `Promise`. It can run conditionally, in an event handler, or after checking a feature flag.

```javascript
const { add } = await import("./math.js");

button.addEventListener("click", async () => {
  const { openModal } = await import("./modal.js");
  openModal();
});
```

A dynamically imported default export is available on `.default`:

```javascript
const mod = await import("./Button.js");
const Button = mod.default;
```

Use dynamic imports for:

- **Code-splitting:** Heavy libraries such as charts, editors, or PDF tools that are not needed on first paint
- **Routes:** `React.lazy(() => import("./Page"))` with `Suspense`
- **Conditional features:** An admin panel or a polyfill needed only in older browsers
- **Optional plugins:** Functionality loaded only when the user opens a specific tool

Dynamic imports add an extra network round trip and require loading and error UI. They may also be less aggressively tree-shaken than static named imports. Do not dynamically import tiny files that are always needed.

### What is `import.meta`?

`import.meta` exposes module-specific metadata. `import.meta.url` is the current module URL and is useful for workers, WebAssembly, and resolving assets. Vite also exposes environment data through `import.meta.env`.

### What are the ESM interview one-liners?

- Static `import` means always needed, hoisted, analyzable, and tree-shakeable.
- `import()` means on demand, asynchronous, and suitable for splitting the bundle.
- A named export has a fixed exported name; a default export represents the module's main value, and the importer chooses its local name.
- A live binding exposes updates from the exporting module rather than a copied snapshot.

---

## Immutability, Shallow Copies, and Deep Copies

### Why is spread not a deep copy?

Spread syntax and `Object.assign` copy only **one level**. A nested object's reference value is copied, so the original and the copy still point to the same nested object.

Deep-copy options include custom recursion, `structuredClone()`, or a library. Immutability means replacing data instead of mutating existing data, which is common in React and Redux state management.

```javascript
const original = { a: 1, nested: { b: 2 } };
const copy = { ...original };
copy.nested.b = 9; // original.nested.b is also 9
```

---

## Garbage Collection and Memory Leaks

### What causes memory leaks in JavaScript?

Garbage collection frees objects that are no longer reachable.

Common memory leaks include:

- Detached DOM nodes that are still referenced
- Forgotten timers or subscriptions
- Global caches that grow without bounds
- Closures that retain large objects
- `Map` keys that are never deleted

Use a `WeakMap` when the key is an object and the association should not keep that object alive.

---

## Must-Explain Questions

### Why does `typeof null` return `"object"`?

This is a historical JavaScript bug: the first implementation tagged `null` like an object. The behavior remains for backward compatibility.

Check for `null` with `value === null`.

### How do `null`, `undefined`, and a missing property differ?

- **`undefined`:** A declared variable without an assigned value, or the result of a function with no `return` value.
- **`null`:** An intentional “no value” marker.
- **Missing property:** `obj.x` evaluates to `undefined`, but `"x" in obj` is `false` and `Object.hasOwn(obj, "x")` is `false`.

Optional chaining safely returns `undefined` for a missing path: `obj?.x`.

### How does `this` work for different call styles?

The **call site** determines `this` for regular functions. Arrow functions are the exception because they use **lexical `this`** from the enclosing scope. See the [`this`](#this) section.

### What does a closure capture, and when is it useful?

A closure captures outer variables as **live bindings**. Closures are useful for encapsulation, callbacks, and factories.

Watch for shared loop variables and accidental retention of large objects.

### Why is spread not a deep copy?

Only the top level is new. For nested objects and arrays, the reference values are copied, so the original and copy share those nested values. Mutating a shared nested object affects both.
