# JavaScript Interview Study Guide: Networking and Browser APIs

Concise, answer-first explanations you can say aloud in an interview. Use the examples when the interviewer asks you to go deeper.

---

## HTTP, DNS, and TLS (short)

### What happens when you type a URL?

1. **DNS** — hostname → IP (cache: browser, OS, resolver)
2. **TCP** connect (or QUIC for HTTP/3)
3. **TLS** handshake (HTTPS) — certificates, keys; session resumption helps later
4. **HTTP** request (`GET /`, headers, cookies)
5. Response: HTML, then dependent CSS/JS/images (new connections or multiplexing on HTTP/2/3)

**HTTP/2** multiplexes streams on one connection (no head-of-line blocking at HTTP layer; TCP still can block). **HTTP/3** uses QUIC/UDP to reduce that.

Status families: 2xx success, 3xx redirect, 4xx client, 5xx server. `301`/`308` vs `302`/`307` (method preservation).

---

## `fetch` vs `XMLHttpRequest`

### What are the main differences?

**`fetch`**

- Promise-based; pairs with `async/await`
- Request/response are **streamable** (`body` is a `ReadableStream`)
- `AbortController` to cancel
- **Does not reject** on HTTP 404/500 — only on network failure or abort. Check `response.ok` / `status`
- No progress events for upload/download in the basic API (XHR has `progress`; for fetch, Streams / extra APIs)
- Cookies: `credentials: "same-origin"` default; `"include"` for CORS with cookies
- Cannot easily observe **request** progress the way XHR `upload.onprogress` does

**`XMLHttpRequest`**

- Callbacks / events (`onreadystatechange`, `onload`)
- `xhr.status` and you typically treat non-2xx in the same `load` handler
- `xhr.upload.onprogress` — classic file upload bars
- Synchronous XHR exists (`open(..., false)`) — **never use it** (blocks the thread)

```javascript
const res = await fetch("/api", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
  signal: controller.signal,
});
if (!res.ok) throw new Error(res.status);
const data = await res.json();
```

Interview one-liner: **prefer** `fetch` **today; know XHR for progress and legacy code; neither is a WebSocket.**

---

## WebSocket, Server-Sent Events, and Polling

### How do you get live data from the server?

**Short polling** — client `fetch`s every N ms. Simple, wasteful, latency up to N. Easy with HTTP cache/CDN sometimes against you.

**Long polling** — client opens a request; server **holds it** until an event or timeout; client opens the next. Fallback when WS is blocked.

**Server-Sent Events (`EventSource`)**

- HTTP response, **server → client** stream of `text/event-stream`
- Auto-reconnect, event ids
- Text/UTF-8; typically **GET** only
- Good for notifications, feeds, one-way logs

**WebSocket**

- After HTTP upgrade, **full-duplex** socket (client and server both send)
- Binary and text
- You handle reconnect, heartbeat, backpressure
- Chat, collab cursors, multiplayer, bidirectional streams

```javascript
const ws = new WebSocket("wss://example.com/ws");
ws.addEventListener("message", (e) => JSON.parse(e.data));
ws.send(JSON.stringify({ type: "ping" }));
```

```javascript
const es = new EventSource("/events");
es.addEventListener("notice", (e) => console.log(e.data));
```

Choose **SSE** for one-way server push over HTTP. Choose **WebSocket** when the client must send often. Polling is the compatible baseline.

---

## Web Workers and Service Workers

### What is each worker for?

**Web Worker**

- Extra **thread** for CPU work (parse, crypto, canvas pixel buffers, compression)
- No DOM, no `window`. Talk via `postMessage` (structured clone; `Transferable` for buffers)
- `new Worker(url)` or `new Worker(url, { type: "module" })`
- Dedicated vs **SharedWorker** (multiple tabs)

Use when a job would **block the main thread** (INP / jank).

**Service Worker**

- A worker that sits on the **network path** of an origin (after HTTPS + register)
- Can **intercept** `fetch`, cache responses, enable **offline**, push notifications, background sync
- Lifecycle: `install` → `activate` → `fetch`. Wait until `clients.claim` / `skipWaiting` if you need control immediately
- Not for arbitrary CPU unless combined with other workers; it can be killed when idle

```javascript
navigator.serviceWorker.register("/sw.js");
```

```javascript
// sw.js
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
```

Not the same as a Web Worker: **SW is about network/cache/offline; WW is about CPU off the UI thread.**

---

## Browser Caching

### How does HTTP caching work?

The browser (and sometimes a CDN) may reuse a response instead of hitting the origin.

**Freshness (does not revalidate)**

- `Cache-Control: max-age=31536000, immutable` — hashed static assets (`app.abc123.js`)
- `Expires` — older equivalent

**Revalidation**

- `Cache-Control: no-cache` — **must revalidate** (misleading name; it can still store)
- `Cache-Control: no-store` — do not write to disk (private data)
- `ETag` / `If-None-Match` → `304 Not Modified`
- `Last-Modified` / `If-Modified-Since`

**`private` vs `public`** — whether shared caches (CDN) may store.

**Heuristic caching** exists if the server sends little cache info; do not rely on it.

HTML is often `no-cache` or short `max-age` so users get new asset **URLs**. Assets get **content hashes** and long `max-age`.

Other layers: memory cache, disk HTTP cache, **Service Worker cache**, bfcache (`pageshow` / `pagehide`, `event.persisted`) for back/forward.

`fetch` / XHR: default cache mode follows HTTP rules; `cache: "no-store"` bypasses.

---

## Must-Explain Questions

### Why does `fetch` “succeed” on 500?

The network succeeded. HTTP errors are still `Response` objects. Check `res.ok`.

