# TypeScript Deep Answers

Short spoken answers for six topics. Say the paragraph. Use the bullets only if they ask a follow-up.

Russian copy: [typescript-deep-topics.ru.md](typescript-deep-topics.ru.md). Shorter checklist for the rest of the language: [typescript.md](typescript.md).

---

## 1. `type` vs `interface`

Both name a shape, and TypeScript checks it structurally: the fields matter, the name does not. I use `interface` for an object or class contract that other code might `extend` or augment. I use `type` for a union, a tuple, a mapped or conditional type, a primitive, or a name for a type I already have. Start with `interface`, and switch when an interface cannot express it.

```ts
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

interface User {
  id: string;
  name: string;
}
```

- Only `interface` merges. Two `interface User` in the same scope combine. A second `type User` is an error. Files that are modules do not merge with each other; `declare module` and `declare global` do.
- `interface` uses `extends`. `type` uses `&`. Prefer `extends` for object contracts. A long `&` chain typechecks slower and errors worse.
- An interface cannot be a union and cannot `extend` a union. The union itself is a `type`: `type Shape = Circle | Rect`.
- A class can `implement` either. `implements` checks the shape and copies no behavior. Private and `#` fields are the exception: they make the class nominal.
- For props, use `type` when the type is built with `Omit` or `ComponentProps`. Use `interface` for a stable public component contract.

---

## 2. Asynchrony in TypeScript

Asynchrony in TypeScript is ordinary JavaScript `Promise` and `async/await`, with types added. An `async` function always returns `Promise<T>`, where `T` is what it `return`s. `await` turns `Promise<T>` into `T`. The key point: the type describes only the success result. Errors are not part of the type, so the variable in `catch` is `unknown`.

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

- **Return type.** On public functions I write `Promise<User>` explicitly. A function that returns nothing is `Promise<void>`.
- **Parallel requests.** `Promise.all` keeps the type of each item: `const [user, posts] = await Promise.all([getUser(id), getPosts(id)])` gives `User` and `Post[]`. `Promise.allSettled` returns `{ status: "fulfilled"; value } | { status: "rejected"; reason }`, and I narrow on `status`.
- **Errors.** The error type is not declared anywhere, so `catch (error)` is `unknown`. I narrow with `instanceof Error`. When failure is a normal outcome (not found, failed validation), I return `{ ok: true; data } | { ok: false; error }` instead of throwing. Then the caller has to handle both branches.
- **API data.** `res.json()` returns `any`, and `as User` checks nothing. Data from outside needs validation (Zod) or a type guard.
- **`Awaited<T>`.** Gets the type out of a promise: `Awaited<ReturnType<typeof getUser>>` is `User`.
- **Common mistake.** An `async` function can be passed where `() => void` is expected (`onClick`, `forEach`). Nobody awaits the promise, and the error is lost. `forEach(async ...)` does not wait for iterations: use `for...of` with `await` for sequence, `Promise.all` for parallel.

---

## 3. Typing React and Node

Type the boundary. Props, events, refs, hook state, and context are created in typed code, so the compiler can check them. `req.body`, `JSON.parse`, `fetch`, and `process.env` are not checked until something validates them at runtime.

```tsx
type ButtonProps = {
  variant?: "primary" | "ghost";
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};
```

- `ReactNode` is anything renderable. `ReactElement` is one element. Since `@types/react` 18, `FC` does not add `children`.
- Read `event.currentTarget`, not `target`. `currentTarget` is the element the handler is attached to.
- Take DOM props from `ComponentPropsWithoutRef<"button">` and `Omit` the keys you replace. Without `Omit`, incompatible handlers collapse to `never`.
- Ref types depend on `@types/react`. In React 18, `useRef(null)` has a readonly `current`. In React 19, `ref` is a normal prop, and `useRef` is mutable and requires an initial value.
- `useState(null)` infers `null`. `useState([])` infers `never[]`. Pass a type argument.
- Type context as `createContext<User | undefined>(undefined)` and throw in a hook used outside the provider.
- A generic component is worth it when `T` links `items` to `renderItem`. A polymorphic `as` is an `ElementType` plus `Omit<ComponentPropsWithoutRef<E>, own keys>`.
- On Node, use `"module": "nodenext"` and `verbatimModuleSyntax`. `process.env[name]` is `string | undefined`; parse env once at startup. An Express generic does not parse JSON. Validate, then extend `Request` locally. Augment `namespace Express` only when every request should grow that field.

---

## 4. Generics

A generic is a placeholder the caller fills, and TypeScript usually infers it. Use one when two positions must stay linked, as in `first<T>(items: readonly T[]): T | undefined`. If the function only ever accepts `User`, the parameter is `User`.

```ts
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

- `extends` here is a constraint, not class inheritance. `T = unknown` is only a default. `T extends { id: string } = ...` limits and defaults.
- `fn("ok", 0)` does not become `string | number`. The first site fixes `T`, and the second is checked, so `0` is not `"ok"`.
- The silent failure is a list of literals plus another value: `createStreetLight(["red", "yellow"], "blue")` widens the union to include `"blue"`. `NoInfer<C>` (TypeScript 5.4) checks that argument and does not let it widen `C`.
- `<const T>` (TypeScript 5.0) keeps `readonly ["/home", "/users"]` instead of widening to `string[]`.
- A naked `T extends U ? X : Y` distributes. `ToArray<string | number>` is `string[] | number[]`. Wrap it as `[T] extends [U]` to stop distribution.
- Returns are covariant. Parameters are contravariant under `strictFunctionTypes`: `(animal: Animal) => void` can be used as `(dog: Dog) => void`, and not the reverse. Method syntax skips that check, so type a callback as a function property.
- A generic function infers `T` on each call. A generic class fixes `T` for the instance. `get<T>(id): Promise<T>` is unchecked unless the method validates.
- Drop `T` if it appears once, or only as `unknown`. Do not constrain to `object`: that includes arrays and functions.

---

## 5. Narrowing

Narrowing is control flow shrinking a union. The checks are `typeof`, `===`, `== null`, `in`, `instanceof`, `Array.isArray`, a discriminant in `switch`, a type guard, and an assertion function. `as` is not a check.

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

- `typeof null` is `"object"`, so also check `!== null`. Use `instanceof` for classes.
- `== null` is the one place I use `==`. It covers both `null` and `undefined`.
- Prefer a discriminant to optional fields (`data?: User; error?: string`). The union makes the illegal combination unrepresentable. `never` in `default` fails the build when a new variant is not handled.
- `value is User` tells the checker what `true` means. TypeScript does not prove the function body. `filter(isDefined)` changes the element type. `filter(Boolean)` also drops `0` and `""`.
- `asserts value is User` narrows after the call, because the other path throws.
- A narrow on a property is dropped after a function call: the callee might mutate the object. Copy the value into a `const`.
- `!` and `as` belong where a check just happened and the checker cannot see it. `satisfies` checks a value and keeps the narrower inferred type. It does not narrow inside `if`.

---

## 6. Utility types — practical advice

Utilities keep a derived type attached to its source. `Pick<User, "id" | "name">` follows `User["id"]` when it changes. A hand-copied interface does not. If "public user" is a real concept, name it: `type PublicUser = Omit<User, "passwordHash">`.

```ts
type UserPatch = Partial<Pick<User, "name" | "email">>;
type PublicUser = Omit<User, "passwordHash">;
```

- For a PATCH body, `Pick` the editable keys, then `Partial`. `Partial<User>` also makes `id` optional.
- `Partial` and `Readonly` are shallow, and `Partial` does not add `null`. With `exactOptionalPropertyTypes`, `{ name?: string }` rejects `{ name: undefined }`.
- `Omit<A | B, "id">` collapses to `{ kind: "a" | "b" }`. `keyof` of a union is only the shared keys, so the other fields disappear. Distribute first: `T extends unknown ? Omit<T, K> : never`.
- `Omit<User, "passwordHsh">` compiles and removes nothing, because `K extends keyof any`. `Pick` rejects the typo.
- `as const satisfies Record<Role, string>` checks that every key exists and keeps the literal values. Annotating `Record<Role, string>` widens the values to `string`.
- With `noUncheckedIndexedAccess`, `record[key]` is `T | undefined`. Handle the missing key.
- `ReturnType` of an overload is the last signature.
- `Partial` by hand is `{ [K in keyof T]?: T[K] }`. `Pick` is `{ [P in K]: T[P] }`. `{ [K in keyof T] }` distributes over a union. `Pick` does not: `Pick<A | B, "kind">` is `{ kind: "a" | "b" }`.
- A utility cannot make `JSON.parse` return `User`. That is a schema, or it is `as`.
