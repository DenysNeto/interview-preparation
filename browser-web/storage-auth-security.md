# JavaScript Interview Study Guide: Storage, Auth, and Security

Concise, answer-first explanations you can say aloud in an interview. Use the examples when the interviewer asks you to go deeper.

---

## Cookies, `localStorage`, `sessionStorage`, IndexedDB

### How do you choose a storage API? — very important


|                | Cookies                                                                | `localStorage` | `sessionStorage`                                    | IndexedDB                 |
| -------------- | ---------------------------------------------------------------------- | -------------- | --------------------------------------------------- | ------------------------- |
| Sent to server | Yes (unless `HttpOnly` still sent; all non-`HttpOnly` too). Limit size | No             | No                                                  | No                        |
| Capacity       | ~4 KB per cookie                                                       | ~5 MB          | ~5 MB                                               | Large (100s of MB, quota) |
| Persistence    | `Expires` / `Max-Age`; session cookie if omitted                       | Until cleared  | Tab/window (duplicated on restore in some browsers) | Until cleared             |
| API            | `document.cookie` string; better `Set-Cookie` from HTTP                | Sync strings   | Sync strings                                        | Async, structured data    |
| JS access      | Not if `HttpOnly`                                                      | Yes            | Yes                                                 | Yes                       |


**Cookies** — session id, CSRF token. Set from the **server** with `Set-Cookie`. Flags:

- `HttpOnly` — JS cannot read (mitigates XSS stealing the cookie)
- `Secure` — HTTPS only
- `SameSite=Lax` / `Strict` / `None` — CSRF control (`None` needs `Secure`)
- `Path`, `Domain`

**`localStorage` / `sessionStorage`** — `setItem` / `getItem` / `removeItem`; **strings only** (`JSON.stringify`). Same-origin. Sync and can **block** the main thread on large data. `storage` event fires in **other** tabs for `localStorage`.

**IndexedDB** — large structured data, indexes, transactions, async. Use for offline caches, drafts, large client DBs. Wrappers (idb) hide the verbose API.

**Do not** put secrets or access tokens in `localStorage` (any XSS reads them). Prefer memory or `HttpOnly` cookies for session.

### Why do cookies exist?

HTTP does not remember the previous request. A cookie is a small string the **server asks the browser to store** and then **send back automatically** on later requests to that site.

```text
1. POST /login
2. Server: Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Lax
3. Browser stores it
4. GET /profile
5. Browser adds: Cookie: sessionId=abc123
```

Without that, the server cannot tell your second visit from a stranger’s. That is why cookies exist: **session** (logged-in user, cart), not as a general app database.

`localStorage` and `IndexedDB` are for data the server does not need on every request. A cookie is sent on matching requests, so it costs bandwidth and should stay small (~4 KB).

### What do you actually put in a cookie?

A **small identifier**, not the user’s profile.

- **Session id** — random string (`sessionId=abc123`). The server looks up the user, cart, and permissions. Password, email, and profile stay on the server.
- **CSRF token** — proves a state-changing request came from your page (see below).
- **A preference the server must see before JS runs** — language or region, if the first HTML depends on it.
- **Analytics visitor id** — often needs consent.

Do not store passwords, card data, large JSON, or a long-lived secret that JavaScript must read.

### How do you set one?

Prefer the server:

```http
Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600
```

JavaScript can set a non-`HttpOnly` cookie with `document.cookie = "theme=dark; Max-Age=31536000; Path=/; Secure; SameSite=Lax"`. It **cannot** set `HttpOnly`. Only the server can.

Same-origin `fetch` sends cookies by default. Cross-origin needs `credentials: "include"` **and** a CORS response that allows credentials with a specific origin, not `*`.

### What do the flags mean?

- **`HttpOnly`** — JavaScript cannot read or write this cookie. `document.cookie` will not show it. Stops the “read the session id and send it to the attacker” step. Does **not** stop XSS itself.
- **`Secure`** — send only over HTTPS.
- **`SameSite=Lax`** — usual default. The browser does not attach the cookie to most cross-site requests (it still sends it on a top-level GET navigation). Cuts a lot of CSRF.
- **`SameSite=Strict`** — not sent on any cross-site request, including the link that opens your site. Safer, sometimes surprising.
- **`SameSite=None; Secure`** — allow cross-site send (embedded app, third-party context). `None` requires `Secure`.
- **`Path=/`** — whole site. **`Domain`** — widen to subdomains only if you must.
- **`Max-Age` / `Expires`** — lifetime. Omit them and it is a session cookie (gone when the browser session ends).

### Does `HttpOnly` block XSS?

No. It blocks **reading the cookie from script**.

Without `HttpOnly`:

1. A bug such as `innerHTML` with untrusted data runs the attacker’s script **on your origin**.
2. That script reads `document.cookie` and sees `sessionId`.
3. It sends the value to the attacker.
4. The attacker replays `Cookie: sessionId=...` from their own machine. That is **session hijacking**. Same-origin policy does not stop this: the script is already running inside your origin.

With `HttpOnly`, steps 2–4 fail. Step 1 still happens. The script can still `fetch("/api/transfer", { credentials: "include" })` while the victim has the page open. The browser attaches the cookie; the script never sees the value. So `HttpOnly` limits **theft of the session**, not **actions during the visit**.

Close XSS separately: do not inject untrusted HTML (`textContent`, not `innerHTML`), escape on the server, CSP (`script-src`), `Secure`, a sensible `SameSite`, short sessions you can revoke.

### Where does a Bearer token live?

The browser does **not** store or send a Bearer token for you. Your app keeps it and sets the header:

```http
Authorization: Bearer eyJhbGciOi...
```

| Place | What you get |
| --- | --- |
| Memory (variable, React state) | Lost on refresh. Shortest XSS window. Right place for a short-lived access token. |
| `sessionStorage` | Until the tab closes. Any XSS on the page can read it. |
| `localStorage` | Until cleared. XSS can read it and reuse it for a long time. Convenient and weak. |
| `HttpOnly` cookie | JS cannot read it, but the browser sends it automatically. That is no longer an `Authorization` header, and CSRF applies. |

Bearer fits APIs, mobile clients, and SPAs. A classic website session is often simpler as an `HttpOnly` cookie.

### Why keep both a Bearer token and a cookie?

They are not two copies of the same login. A common SPA split:

```text
access token (Bearer) — in memory, lives minutes, sent as Authorization
refresh token — HttpOnly cookie, lives days, browser sends it only to the refresh endpoint
```

While the tab is open, API calls use `Authorization: Bearer …`. JavaScript knows that token, but it expires quickly. After a reload the memory token is gone. The app calls `/refresh`. The browser attaches the refresh cookie. The server returns a new access token. JavaScript never reads the refresh token (`HttpOnly`).

One long-lived token in `localStorage` is stealable by XSS for weeks. A session cookie on every request is stealable as an action (CSRF) because the browser attaches it. Splitting them shrinks both windows.

| Piece | Where | Job |
| --- | --- | --- |
| Access token | memory + `Authorization` | call the API for a few minutes |
| Refresh token | `HttpOnly` cookie | get a new access token after reload |
| Session cookie | `HttpOnly` cookie | whole-site login when you are not using Bearer |
| CSRF token | page + header or form field | prove the cookie request came from your page |

Sometimes the site session is a cookie and a separate API (or a mobile app) uses Bearer. Do not send both mechanisms on every request unless each one has a job.

### What is a CSRF token, and why?

**CSRF** (cross-site request forgery): another site makes the victim’s browser call your site. The attacker never reads the cookie. The browser attaches it anyway.

Example shape: the user is logged into the bank. A page on another origin submits `POST https://bank.example/transfer`. The browser adds `Cookie: sessionId=…`. The server sees a logged-in user.

A **CSRF token** is a random value the server gave **your** page. The form or `fetch` must send it back explicitly:

```http
POST /transfer
Cookie: sessionId=abc123
X-CSRF-Token: k3f9...
```

The server checks that the token matches the session. The other site can trigger a request that includes the cookie, but same-origin policy stops it from reading your HTML, so it cannot copy the token.

Use it when **auth is a cookie** and the action changes state (transfer, email change, delete). A Bearer token in `Authorization` usually does not need a CSRF token: the browser will not add that header for a foreign site.

`SameSite=Lax` or `Strict` already blocks many CSRF cases. Still send a token on important POSTs: `Lax` is not every old client and not every subdomain setup.

---

## Same-origin Policy, CORS, CSP

### What is an origin and what does SOP protect?

Origin = **scheme + host + port**. `https://a.com` ≠ `http://a.com` ≠ `https://a.com:441`.

**Same-origin policy** stops a page’s JS from reading another origin’s DOM or typical responses. Cookies are partitioned by site/origin rules plus `SameSite`.

**CORS** is the server **opting in** so `fetch` from origin A can read origin B’s response:

- Simple requests vs **preflight** `OPTIONS` (`Access-Control-Request-Method/Headers`)
- `Access-Control-Allow-Origin` (not `*` if `credentials: include`)
- `Allow-Credentials`, `Allow-Methods`, `Allow-Headers`

**CSP** (`Content-Security-Policy`) — which scripts, styles, images may load; `script-src 'self'` reduces XSS. `'unsafe-inline'` weakens it; nonces/hashes are stronger.

**Common attacks**

- **XSS** — attacker JS in your origin (trust HTML). Escape, CSP, `HttpOnly`
- **CSRF** — browser sends cookies on cross-site form POST. `SameSite`, CSRF tokens, not using cookies for some APIs
- **Clickjacking** — `X-Frame-Options` / `frame-ancestors`
- **MIME sniffing** — `X-Content-Type-Options: nosniff`

---

## Must-Explain Questions

### Cookie vs `localStorage` for a token?

If it must go to the server automatically, cookie (with `Secure`, `HttpOnly`, `SameSite`). If XSS is in scope, `localStorage` is readable by the attacker’s script. Neither replaces server-side session design.

### Does `HttpOnly` stop XSS?

No. It stops `document.cookie` from exposing that cookie. The injected script still runs and can call your API with `credentials: "include"` until the user leaves. Fix XSS by not injecting untrusted HTML, plus CSP.

### Why both a Bearer access token and a cookie?

The access token in memory authorizes API calls and dies in minutes. The refresh token in an `HttpOnly` cookie survives reload and is not readable by script. They are not duplicates.

