# Curry + Compose/Pipe Utilities

## Statement
Implement utility helpers:
1) `curry` for a fixed-arity function.
2) `compose` (right-to-left) and `pipe` (left-to-right) for unary functions.

## Requirements
- `curry` should allow partial application until all args are collected.
- `compose` and `pipe` should work with a list of unary functions.
- Keep implementation practical and readable for interview constraints.

## Time box
25-30 minutes

## What interviewers look for (Что ищут)
- Понимание функциональных паттернов и порядка вычисления.
- Аккуратность в реализации частичного применения.
- Баланс между строгой типизацией и простотой решения.
- Умение объяснить ограничения (особенно для variadic compose).

## Hints
- В `curry` проверяй `args.length >= fn.length`.
- Для `compose` используй `reduceRight`, для `pipe` — `reduce`.
- Начни с unary-функций для более простой типизации.

## Reference solution — complete TypeScript
```ts
type AnyFn = (...args: any[]) => any;
type Unary<T = any, R = any> = (value: T) => R;

export function curry<F extends AnyFn>(fn: F) {
  function curried(...args: any[]): any {
    if (args.length >= fn.length) {
      return fn(...args);
    }
    return (...nextArgs: any[]) => curried(...args, ...nextArgs);
  }
  return curried as (...args: Parameters<F>) => ReturnType<F>;
}

export function compose<T>(...fns: Unary[]): Unary<T> {
  return (input: T) => fns.reduceRight((acc, fn) => fn(acc), input);
}

export function pipe<T>(...fns: Unary[]): Unary<T> {
  return (input: T) => fns.reduce((acc, fn) => fn(acc), input);
}

// Example:
const add = (a: number, b: number, c: number) => a + b + c;
const curriedAdd = curry(add);
const sum = curriedAdd(1)(2)(3);

const trim = (s: string) => s.trim();
const upper = (s: string) => s.toUpperCase();
const exclaim = (s: string) => `${s}!`;

const loud1 = compose(exclaim, upper, trim);
const loud2 = pipe(trim, upper, exclaim);

console.log(sum, loud1("  hi  "), loud2("  hi  "));
```

## Follow-up questions
- Как типизировать `compose` без потери типов между шагами?
- Зачем в `curry` учитывать `fn.length` и где это может подвести?
- Когда такой FP-подход ухудшает читаемость бизнес-кода?
