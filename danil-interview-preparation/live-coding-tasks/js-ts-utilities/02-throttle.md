# Throttle Utility

## Statement
Implement a generic `throttle` function in TypeScript. It should ensure the wrapped function is executed at most once per `waitMs` interval.

## Requirements
- Preserve argument types and `this` context.
- Support options:
  - `leading` (default `true`)
  - `trailing` (default `true`)
- Return throttled function with:
  - `cancel()`
  - `flush()`

## Time box
20-25 minutes

## What interviewers look for (Что ищут)
- Понимание окон времени и того, когда можно/нельзя вызывать функцию.
- Аккуратную реализацию `leading + trailing`.
- Уверенную работу с временем (`Date.now`) и таймерами.
- Чистый API (`cancel`, `flush`) и предсказуемое поведение.

## Hints
- Храни `lastInvokeTime` и `timeoutId`.
- Если осталось время до следующего окна, можно планировать trailing-вызов.
- `flush()` должен выполнить отложенный вызов немедленно.

## Reference solution — complete TypeScript
```ts
type Throttled<F extends (this: any, ...args: any[]) => any> = ((
  this: ThisParameterType<F>,
  ...args: Parameters<F>
) => ReturnType<F> | undefined) & {
  cancel: () => void;
  flush: () => ReturnType<F> | undefined;
};

interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

export function throttle<F extends (this: any, ...args: any[]) => any>(
  fn: F,
  waitMs: number,
  options: ThrottleOptions = {}
): Throttled<F> {
  const leading = options.leading ?? true;
  const trailing = options.trailing ?? true;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<F> | null = null;
  let lastThis: ThisParameterType<F> | null = null;
  let lastInvokeTime = 0;
  let lastResult: ReturnType<F> | undefined;

  const invoke = (time: number) => {
    if (!lastArgs || !lastThis) return lastResult;
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = null;
    lastThis = null;
    lastInvokeTime = time;
    lastResult = fn.apply(thisArg, args);
    return lastResult;
  };

  const shouldInvoke = (time: number) => {
    if (lastInvokeTime === 0) return true;
    return time - lastInvokeTime >= waitMs;
  };

  const remainingWait = (time: number) => waitMs - (time - lastInvokeTime);

  const timerExpired = () => {
    timeoutId = null;
    const now = Date.now();
    if (trailing && lastArgs) {
      invoke(now);
    }
  };

  const throttled = function (this: ThisParameterType<F>, ...args: Parameters<F>) {
    const now = Date.now();
    if (lastInvokeTime === 0 && !leading) {
      lastInvokeTime = now;
    }

    lastArgs = args;
    lastThis = this;

    if (shouldInvoke(now)) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      return invoke(now);
    }

    if (!timeoutId && trailing) {
      timeoutId = setTimeout(timerExpired, remainingWait(now));
    }

    return lastResult;
  } as Throttled<F>;

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastInvokeTime = 0;
    lastArgs = null;
    lastThis = null;
  };

  throttled.flush = () => {
    if (!timeoutId) return lastResult;
    clearTimeout(timeoutId);
    timeoutId = null;
    if (lastArgs) {
      return invoke(Date.now());
    }
    return lastResult;
  };

  return throttled;
}
```

## Follow-up questions
- Как добавить `maxWait` в throttle?
- Почему иногда `leading: false` полезнее для аналитики событий?
- Какие edge cases появятся при системном времени, которое "прыгает"?
