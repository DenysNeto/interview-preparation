# Debounce Utility

## Statement
Implement a reusable `debounce` utility in TypeScript. It should delay function execution until calls stop for `waitMs` milliseconds.

## Requirements
- Preserve argument types and `this` context.
- Return a debounced function with:
  - `cancel()` to clear pending execution.
  - `flush()` to execute immediately if pending.
- Support optional `leading` and `trailing` behavior:
  - `leading: true` runs on the first call in a burst.
  - `trailing: true` runs after the burst ends.
- Default behavior: `leading = false`, `trailing = true`.

## Time box
20-25 minutes

## What interviewers look for (Что ищут)
- Умение точно формализовать поведение `leading/trailing`.
- Корректную работу с таймером и очисткой ресурсов.
- Сильную типизацию (дженерики, `ThisParameterType`, `Parameters`).
- Обработку граничных кейсов (`cancel`, `flush`, частые вызовы).

## Hints
- Начни с хранения `timeoutId`, `lastArgs`, `lastThis`.
- Отдельно подумай, когда можно вызвать функцию "сразу" (`leading`).
- `flush()` обычно должен вызывать отложенный `trailing`-вызов.

## Reference solution — complete TypeScript
```ts
type Debounced<F extends (this: any, ...args: any[]) => any> = ((
  this: ThisParameterType<F>,
  ...args: Parameters<F>
) => void) & {
  cancel: () => void;
  flush: () => ReturnType<F> | undefined;
};

interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
}

export function debounce<F extends (this: any, ...args: any[]) => any>(
  fn: F,
  waitMs: number,
  options: DebounceOptions = {}
): Debounced<F> {
  const leading = options.leading ?? false;
  const trailing = options.trailing ?? true;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<F> | null = null;
  let lastThis: ThisParameterType<F> | null = null;
  let lastResult: ReturnType<F> | undefined;

  const invoke = () => {
    if (!lastArgs || !lastThis) return undefined;
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = null;
    lastThis = null;
    lastResult = fn.apply(thisArg, args);
    return lastResult;
  };

  const startTimer = () => {
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (trailing) {
        invoke();
      } else {
        lastArgs = null;
        lastThis = null;
      }
    }, waitMs);
  };

  const debounced = function (this: ThisParameterType<F>, ...args: Parameters<F>) {
    const isLeadingCall = leading && timeoutId === null;

    lastArgs = args;
    lastThis = this;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (isLeadingCall) {
      lastResult = fn.apply(this, args);
      if (trailing) {
        startTimer();
      } else {
        timeoutId = setTimeout(() => {
          timeoutId = null;
        }, waitMs);
      }
      return;
    }

    startTimer();
  } as Debounced<F>;

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  debounced.flush = () => {
    if (timeoutId === null) return lastResult;
    clearTimeout(timeoutId);
    timeoutId = null;
    if (!trailing) return lastResult;
    return invoke();
  };

  return debounced;
}

// Example:
const onResize = debounce(
  function (width: number) {
    console.log("Resize handled:", width);
  },
  250,
  { leading: false, trailing: true }
);

onResize(1000);
onResize(1100);
onResize.flush();
```

## Follow-up questions
- Как реализовать `maxWait`, чтобы функция гарантированно вызывалась хотя бы раз в N мс?
- Чем отличается поведение debounce от throttle в UX?
- Какие риски при использовании debounce для API-запросов с отменой?
