# Auth Middleware with Cookie Session Check

## Statement
Protect private routes with `middleware.ts`:
- Check session cookie.
- Redirect unauthenticated users to `/login`.
- Keep public routes accessible.
- Configure `matcher` properly.

## Requirements
- Create `middleware.ts` at project root.
- Read session from cookies.
- Redirect to `/login` when session is missing/invalid.
- Use matcher to protect selected route groups only.
- Avoid blocking static assets and API routes unintentionally.

## Time box
25-35 minutes

## What interviewers look for (Что ищут)
- Понимание места middleware в lifecycle запроса.
- Умение работать с `NextRequest`, `NextResponse`, `request.cookies`.
- Корректный `matcher`, чтобы не сломать `_next/static`, favicon и публичные страницы.
- Чистую и предсказуемую логику redirect.
- Осознание, что проверка cookie в примере упрощенная и требует верификации токена в проде.

## Hints
- Используй `request.nextUrl.clone()` перед изменением `pathname`.
- Добавь `next` query param, чтобы после логина вернуть пользователя назад.
- Проверь, что `/login` не попадает под защиту, иначе получишь redirect loop.

## Reference solution — App Router TypeScript code (show file paths as comments)
```ts
// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function hasValidSession(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get("session")?.value;
  // Demo-only check. In production, verify JWT/signature/expiry.
  return Boolean(sessionCookie && sessionCookie.length > 10);
}

export function middleware(request: NextRequest) {
  const isAuthenticated = hasValidSession(request);

  if (!isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/account/:path*"],
};
```

```tsx
// app/login/page.tsx
export default function LoginPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Login</h1>
      <p>This is a public route. Implement your auth form here.</p>
    </main>
  );
}
```

```tsx
// app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Protected content.</p>
    </main>
  );
}
```

## Follow-up questions
- Какие риски у проверки только наличия cookie без криптографической валидации?
- Что лучше для auth в Next: middleware + cookie, Route Handlers, или провайдер (например, NextAuth)?
- Как реализовать role-based доступ (admin/user) через middleware?
- Как протестировать middleware локально и в e2e?
