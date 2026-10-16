# Suspense Streaming with loading.tsx and error.tsx

## Statement
Create an App Router page that demonstrates streaming:
- Page renders fast shell content immediately.
- A slow async Server Component is wrapped with `Suspense`.
- Add segment-level `loading.tsx` and `error.tsx`.

## Requirements
- Build route with a slow async Server Component.
- Wrap slow part with `Suspense` fallback.
- Include `loading.tsx` for route-level loading UI.
- Include `error.tsx` for error boundary UI.
- Keep code in TypeScript and App Router conventions.

## Time box
35-45 minutes

## What interviewers look for (Что ищут)
- Понимание streaming в React/Next и как `Suspense` улучшает perceived performance.
- Различие между `loading.tsx` (segment-level) и `Suspense fallback` (component-level).
- Корректное использование `error.tsx` как Client Component.
- Умение изолировать медленные части UI в отдельные Server Components.
- Объяснение UX-плюсов и потенциальных trade-offs.

## Hints
- Сделай helper `sleep(ms)` для имитации медленного источника данных.
- `error.tsx` должен содержать `'use client'`, иначе `reset()` недоступен.
- В `page.tsx` оставь быстрый контент вне `Suspense`, чтобы он отрисовался сразу.

## Reference solution — App Router TypeScript code (show file paths as comments)
```ts
// lib/sleep.ts
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

```tsx
// app/analytics/SlowStats.tsx
import { sleep } from "@/lib/sleep";

async function getSlowStats() {
  await sleep(3000);
  return {
    activeUsers: 1284,
    conversionRate: 3.9,
  };
}

export default async function SlowStats() {
  const stats = await getSlowStats();

  return (
    <section style={{ marginTop: 16 }}>
      <h2>Slow Stats (streamed)</h2>
      <p>Active users: {stats.activeUsers}</p>
      <p>Conversion: {stats.conversionRate}%</p>
    </section>
  );
}
```

```tsx
// app/analytics/page.tsx
import { Suspense } from "react";
import SlowStats from "./SlowStats";

export default function AnalyticsPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Analytics</h1>
      <p>This shell content renders immediately.</p>

      <Suspense fallback={<p>Loading slow stats...</p>}>
        <SlowStats />
      </Suspense>
    </main>
  );
}
```

```tsx
// app/analytics/loading.tsx
export default function LoadingAnalytics() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Analytics</h1>
      <p>Preparing analytics page...</p>
    </main>
  );
}
```

```tsx
// app/analytics/error.tsx
'use client';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AnalyticsError({ error, reset }: ErrorProps) {
  return (
    <main style={{ padding: 24 }}>
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
```

## Follow-up questions
- В чем разница между `loading.tsx` и `Suspense fallback`, если оба показывают loading UI?
- Когда streaming может не дать заметного выигрыша?
- Как бы ты добавил skeleton-компонент вместо простого текста?
- Что происходит при ошибке внутри `SlowStats` и как `reset()` работает?
