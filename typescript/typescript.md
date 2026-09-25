# JavaScript Interview Study Guide: TypeScript

Concise, answer-first explanations you can say aloud in an interview. Use the examples when the interviewer asks you to go deeper.

TypeScript **erases types when it compiles**. What runs in the browser or Node is JavaScript. That is the whole safety model: **compile-time checks, no runtime type police** unless you add validation yourself.

---

## Basic Types and Type Inference

### What are the basic types, and when does TS infer them?

Primitives: `string`, `number`, `boolean`, `bigint`, `symbol`, `null`, `undefined`. Also `object`, arrays (`T[]` / `Array<T>`), tuples (`[string, number]`), functions, `void`, `never`, `unknown`, `any`.

**Inference:** if TS can see the value, you usually **omit** the annotation.

```typescript
let n = 1;                 // number
const name = "Ada";        // literal "Ada" (const)
let name2 = "Ada";         // string
const ids = [1, 2];        // number[]
const pair = ["a", 1] as const; // readonly ["a", 1]
```

Annotate when: the variable is declared empty, a public function **parameter**, a return type you want as a contract, or inference widens too much (`[]` is `never[]` until you push).

`strictNullChecks` (on in `strict`) means `string` is not `string | null`. Use `| null` explicitly.

---

## `type` vs `interface`

### When do you choose `type`, and when `interface`?

Both describe object shapes. TS is **structurally typed**: if it has the fields, it matches, name does not matter.

**`interface`**

- Object (and class) shapes; `extends` other interfaces
- **Declaration merging:** two `interface User` in the same scope **merge** (useful for lib augmentation, dangerous in app code)

```typescript
interface User {
  id: string;
}
interface User {
  name: string; // merged: id + name
}
```

**`type` (alias)**

- Unions, intersections, tuples, mapped/conditional types, primitives
- Cannot merge; a second `type User =` is an error
- `type A = B & C` for composition

```typescript
type Id = string | number;
type Success = { ok: true; data: string };
type Fail = { ok: false; error: string };
type Result = Success | Fail;
```

**Practical rule:** `interface` for public object contracts (props, API entities you might extend). `type` for unions, mapped types, and “this is a name for an existing type.” Either is fine for a simple object; **consistency beats dogma**.

Classes: `implements Interface`. Functions: prefer `type` for `(x: A) => B` aliases.

---

## Union and Intersection Types

### How do unions and intersections differ?

**Union (`A | B`):** the value is **one of** the members. You may only use properties that exist on **all** members until you **narrow**.

```typescript
type StringOrNum = string | number;
function len(x: StringOrNum) {
  // x.toFixed() // error — not on string
  return typeof x === "string" ? x.length : x.toFixed(0);
}
```

**Intersection (`A & B`):** the value is **both**. For objects, that means **all fields**. For primitives, `string & number` is `never`.

```typescript
type Timestamped = { createdAt: Date };
type User = { id: string; name: string };
type StoredUser = User & Timestamped;
```

`A | B` is “or”; `A & B` is “and.” Mixing a union with an object: `{ x: 1 } & ({ a: string } | { b: number })` distributes in ways that surprise people — prefer named union members (discriminated unions).

---

## Literal Types and Discriminated Unions

### What are literal types?

A type that is one **specific** value: `"click"`, `200`, `true`. `as const` and `const` assertions preserve literals. Useful for: event names, HTTP methods, state machines.

```typescript
type Method = "GET" | "POST";
const status = 200 as const; // 200, not number
```

### What is a discriminated union?

A union of objects that share a **common literal field** (the discriminant). `switch` / `if` on that field **narrows** the rest.

```typescript
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; w: number; h: number };

function area(s: Shape): number {
  switch (s.kind) {
    case "circle":
      return Math.PI * s.radius ** 2;
    case "rect":
      return s.w * s.h;
    default: {
      const _exhaustive: never = s;
      return _exhaustive;
    }
  }
}
```

This is the standard way to type **API results**, Redux-style actions, and UI states (`loading` | `error` | `ok`). Prefer a discriminant over optional fields on one blob (`error?: string` together with `data?: T`).

---

## Generics and Constraints

### What are generics?

A **type parameter** — a placeholder the caller fills. Functions, types, classes, and interfaces can be generic.

```typescript
function first<T>(items: T[]): T | undefined {
  return items[0];
}
first([1, 2]); // T inferred as number
```

**Constraint (`extends`):** T must be assignable to some type.

```typescript
function getId<T extends { id: string }>(item: T): string {
  return item.id;
}
```

`T extends keyof U`, `T extends (...args: never[]) => unknown`, default params: `Partial<T> = object`.

**Don’t over-generic.** If the function only works on `User`, write `User`. Generics are for **reuse with a relationship** between inputs and outputs (`Promise<T>`, `map<T, U>`).

---

## Narrowing and Type Guards

### How does narrowing work?

Control flow **shrinks** a union: `typeof`, `===`, `in`, `instanceof`, truthiness, `Array.isArray`, discriminated `switch`.

```typescript
function pad(x: string | string[]) {
  if (Array.isArray(x)) return x.join("");
  return x.padStart(2, "0");
}
```

**User-defined type guard:** a function whose return type is `x is T`.

```typescript
function isError(x: unknown): x is { message: string } {
  return typeof x === "object" && x !== null && "message" in x;
}
```

**Assertion function:** `asserts x is T` (or `asserts x`) — throws if false; after the call, TS treats `x` as `T`.

`as T` is a **type assertion**, not a check. It is you overriding the compiler. Prefer guards and discriminants.

---

## `keyof`, `typeof`, Indexed Access

### How do you derive types from other types?

**`typeof` (TS):** the type of a **value**. `const t = typeof x` in JS is a string; in a type position `typeof x` is the TS type of `x`.

```typescript
const config = { api: "/v1", retries: 3 };
type Config = typeof config; // { api: string; retries: number }
```

**`keyof T`:** union of property names (`"id" | "name"`). Often `keyof T & string` if you need strings only.

**Indexed access `T[K]`:** the type of that property.

```typescript
type User = { id: string; age: number };
type Id = User["id"];          // string
type UserKeys = keyof User;    // "id" | "age"
type Values = User[keyof User]; // string | number
```

`T[number]` for array element type. Template literals: `` `on${Capitalize<K>}` `` for event names.

---

## Utility Types: `Pick`, `Omit`, `Partial`, `Required`, `Record`

### What do the common utilities do?

They are **mapped types** in `lib.es5.d.ts` (and later). You can write them yourself; interviews like that.

| Utility | Meaning |
| --- | --- |
| `Partial<T>` | all properties optional |
| `Required<T>` | all properties required (drops `?`) |
| `Pick<T, K>` | subset of keys |
| `Omit<T, K>` | all keys except `K` |
| `Record<K, V>` | object with keys `K` and values `V` |
| `Readonly<T>` | `readonly` properties |
| `Exclude<T, U>` / `Extract<T, U>` | filter unions |
| `NonNullable<T>` | drop `null` \| `undefined` |
| `ReturnType<F>` / `Parameters<F>` | function IO |
| `Awaited<P>` | unwrap Promise |

```typescript
type User = { id: string; name: string; passwordHash: string };
type PublicUser = Omit<User, "passwordHash">;
type Patch = Partial<Pick<User, "name">>;
type RoleMap = Record<"admin" | "user", PublicUser[]>;
```

**`Omit` vs `Pick`:** `Omit` is `Pick<T, Exclude<keyof T, K>>`. Prefer `Pick` when the public surface is small; `Omit` when you subtract secrets.

Also know **mapped types**: `{ [K in keyof T]: T[K] | null }` and **conditional types**: `T extends string ? A : B`, including `infer`.

---

## `any`, `unknown`, `never`, and `void`

### How do these “bottom / top” types differ?

**`any`** — opt out of checking. Assignable to everything and from everything. Spreads through the program. Use only at a **boundary** you will replace, or as a last resort.

**`unknown`** — “we have a value, but TS will not let you use it until you **narrow**.” Safer catch type (`catch (e: unknown)`), safer `JSON.parse` result.

```typescript
function handle(e: unknown) {
  if (e instanceof Error) console.log(e.message);
}
```

**`void`** — function **return** that is not meant to be used (`() => void` for callbacks; returning a value is often still allowed for assignability of callbacks — `forEach` ignores the return).

**`never`** — values that **never happen**: a function that always throws, an infinite loop, or the leftover of an exhaustive union.

```typescript
function fail(msg: string): never {
  throw new Error(msg);
}
```

**`unknown` is safer than `any`** because you cannot call methods or assign `unknown` to `string` without a check or assertion. `any` silently infects.

---

## Function Overloads

### How do overloads work?

You write **several declaration signatures** and **one implementation** (often with a wide type). Callers only see the declarations.

```typescript
function parse(x: string): object;
function parse(x: string, reviver: (k: string, v: unknown) => unknown): object;
function parse(x: string, reviver?: (k: string, v: unknown) => unknown): object {
  return JSON.parse(x, reviver);
}
```

Use overloads when the **return type depends on arguments** in a way a single signature cannot express (or is uglier than overloads). Prefer a generic or a discriminated argument object when that is clearer.

The implementation is checked loosely; **test the overload signatures**, not only the body.

---

## Typing API Responses and Runtime Validation

### Why doesn’t TypeScript check data at runtime?

Types exist only in the type checker and are **stripped** (`tsc` / bundler). `fetch().json()` is `Promise<any>` (or `unknown` in newer libs). Writing `as User` does **not** validate JSON. A backend can send `{ id: 1 }` when you typed `id: string` — TS will not stop that.

**Boundaries:** untrusted input (HTTP, `localStorage`, query params, `postMessage`) must be **parsed** at runtime.

Options:

- **Zod / Valibot / Yup / io-ts / ArkType** — schema → type + parse
- Manual guards for tiny payloads
- Codegen from OpenAPI if the contract is the source of truth (still can drift unless you validate)

```typescript
import { z } from "zod";

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
});
type User = z.infer<typeof UserSchema>;

const data: unknown = await res.json();
const user = UserSchema.parse(data); // throws if invalid
```

Interview: **TS is a compile-time contract; Zod (etc.) is the runtime contract.** Type the `parse` result, not the raw JSON.

---

## Typing React Props, Children, Events, and Refs

### How do you type typical React surfaces?

**Props:** an object type or interface. `children` is `React.ReactNode` (anything renderable) or `React.ReactElement` if you need a single element.

```tsx
type ButtonProps = {
  variant?: "primary" | "ghost";
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export function Button({ variant = "primary", children, onClick }: ButtonProps) {
  return (
    <button type="button" data-variant={variant} onClick={onClick}>
      {children}
    </button>
  );
}
```

**Events:** `React.ChangeEvent<HTMLInputElement>`, `React.FormEvent<HTMLFormElement>`, `React.KeyboardEvent<HTMLDivElement>`. Handler aliases: `MouseEventHandler<T>`.

**Refs:** `useRef<HTMLInputElement>(null)` → `RefObject<HTMLInputElement | null>`. Callback refs: `(node: HTMLDivElement | null) => void`. `forwardRef` + `ComponentPropsWithRef<"button">` to inherit native button attrs.

**`ComponentProps<"a">`** / `ComponentProps<typeof Button>` to reuse a component’s props.

**Generics on lists:** `function List<T>({ items, render }: { items: T[]; render: (item: T) => React.ReactNode })`.

Avoid `React.FC` if you do not want implicit `children` (older `@types/react` added `children` automatically). Either is acceptable if you know what version you are on.

---

## `strict` Mode Settings

### What does `strict` turn on, and what else should you know?

`"strict": true` is a bundle. Important flags inside it:

| Flag | Effect |
| --- | --- |
| `strictNullChecks` | `null` / `undefined` not assignable to every type |
| `strictFunctionTypes` | function params checked contravariantly for callbacks |
| `strictBindCallApply` | `call`/`bind` argument types |
| `strictPropertyInitialization` | class fields must be assigned |
| `noImplicitAny` | inferred `any` is an error |
| `noImplicitThis` | `this` must have a type |
| `alwaysStrict` | emit `"use strict"` |
| `useUnknownInCatchVariables` | `catch (e)` is `unknown` (TS 4.4+, also under strict in recent versions) |

Often added **on top of strict:** `noUncheckedIndexedAccess` ( `arr[i]` is `T | undefined` ), `exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax`.

`skipLibCheck` skips type-checking `.d.ts` in node_modules (build speed; default in many templates).

**Declaration files:** `declare module` / `.d.ts` describe JS libs. `types` / `export {}` for modules. `allowJs` + `checkJs` to type-check JS.

---

## Modules and Structural Typing (short)

### Why does extra stuff still assign?

TS uses **structural** (duck) typing, not nominal. `{ id: "1", extra: true }` is assignable to `{ id: string }` as a **freshness** exception: object **literals** get excess-property checks; variables do not.

```typescript
type Id = { id: string };
const extra = { id: "1", extra: true };
const a: Id = extra;        // OK
const b: Id = { id: "1", extra: true }; // error — excess on literal
```

That is why “I added a field and TS didn’t complain” happens through an intermediate variable.

---

## Must-Explain Questions

### Why doesn’t TypeScript check data at runtime?

The compiler **erases** types. Runtime is JS. `as User` and annotations do not parse JSON. Validate at I/O boundaries (schema libraries, generated clients + checks).

### When do you choose `type` vs `interface`?

`interface` for extendable object contracts and class `implements`; it can **merge**. `type` for unions, tuples, mapped/conditional types, and aliases of existing types. For a simple props object, pick one and stay consistent.

### Why is `unknown` safer than `any`?

`any` disables checking and **propagates**. `unknown` forces **narrowing** before use. Prefer `unknown` for `JSON.parse`, `catch`, and untyped module values.

### How does an exhaustive `never` check help when refactoring?

After you handle every member of a union, the leftover type is `never`. Assigning it to `const _: never = x` **fails to compile** when someone adds `{ kind: "triangle" }` and forgets the `switch`. That is a **compile-time net** for new variants.

```typescript
default: {
  const _exhaustive: never = shape;
  return _exhaustive;
}
```

### What is the difference between `interface` merging and `&`?

Merging two `interface` declarations in one scope **combines** fields automatically (and can surprise you). `type C = A & B` is an explicit intersection you can see in one place.

### `Pick` vs a new interface?

`Pick` **stays in sync** when `User` gains fields you did not pick (they stay out). A copied interface **drifts**. Use `Pick`/`Omit` for “same model, different surface.”
