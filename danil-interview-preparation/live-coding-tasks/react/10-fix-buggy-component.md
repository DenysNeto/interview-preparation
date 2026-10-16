# Fix a Buggy React Component

## Statement
You are given buggy React code.  
Find the issue, explain it briefly, and fix it.

Main bug in this version: stale closure with `setInterval`, so counter gets stuck.

## Requirements
- Explain root cause in simple terms.
- Provide fixed implementation.
- Keep React 18+ and TypeScript.
- Ensure interval is cleaned up on unmount.
- Keep the component simple and interview-realistic.

## Time box
20-30 minutes

## What interviewers look for (Что ищут)
- Умение быстро локализовать причину бага.
- Понимание stale closure в `useEffect`.
- Корректная работа cleanup у `setInterval`.
- Умение предложить минимальный, надежный фикс.
- Краткое и точное объяснение "почему так".

## Hints
> - Посмотри, какое значение `count` видит callback внутри `setInterval`.
> - Если `useEffect` с пустыми зависимостями, callback захватывает initial state.
> - Есть минимум два валидных подхода к фиксу.
> - Выбирай самый простой и безопасный для интервью.

## Reference solution
```tsx
// Buggy version (candidate receives this):
import React, { useEffect, useState } from "react";

export function BuggyCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCount(count + 1); // stale closure: count is always initial value (0)
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  return <p>Count: {count}</p>;
}
```

```tsx
// Fixed version:
import React, { useEffect, useState } from "react";

export function FixedCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      // Functional update always receives latest state value.
      setCount((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  return <p>Count: {count}</p>;
}
```

```tsx
// Alternative valid fix (less preferred in interviews because it recreates interval):
import React, { useEffect, useState } from "react";

export function AlsoValidCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCount(count + 1);
    }, 1000);

    return () => window.clearInterval(id);
  }, [count]);

  return <p>Count: {count}</p>;
}
```

## Follow-up questions
- Why is functional `setState` preferred here?
- Что будет, если забыть cleanup у `setInterval`?
- How would this bug appear in tests?
- Какие еще типичные stale-closure баги встречаются в React hooks?
