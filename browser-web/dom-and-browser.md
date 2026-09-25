# JavaScript Interview Study Guide: DOM and the Browser

Concise, answer-first explanations you can say aloud in an interview. Use the examples when the interviewer asks you to go deeper.

---

## DOM Tree and Element APIs

### What is the DOM? — very important

The **DOM** (Document Object Model) is a **tree of objects** the browser builds from HTML. JS does not edit the file on disk; it mutates this live tree. The browser then updates layout and pixels.

Nodes include `Document`, `Element`, `Text`, `Comment`, and `DocumentFragment`. Most UI work is on **elements**.

```html
<html>
  <body>
    <ul>
      <li>One</li>
    </ul>
  </body>
</html>
```

`document` → `html` → `body` → `ul` → `li` → text `"One"`.

### How do you find and change elements?

**Query**

- `document.getElementById("id")` — fastest id lookup, one node or `null`
- `element.getElementsByClassName` / `getElementsByTagName` — **live** `HTMLCollection`
- `document.querySelector` / `querySelectorAll` — CSS selectors; `NodeList` from `querySelectorAll` is **static**
- `element.closest(selector)` — nearest ancestor (including self) that matches
- `element.matches(selector)`

**Walk**

- `parentElement`, `children`, `firstElementChild`, `nextElementSibling`
- `childNodes` includes text/comment; `children` is elements only

**Create / insert / remove**

```javascript
const li = document.createElement("li");
li.textContent = "Two";
ul.append(li);          // also prepend, before, after
li.remove();
el.replaceWith(other);
```

Prefer `textContent` for plain text (no HTML parse). `innerHTML` parses markup and is an **XSS** footgun with untrusted strings. `insertAdjacentHTML` is the same risk.

**Attributes vs properties**

- `getAttribute` / `setAttribute` — HTML attributes (strings)
- `el.value`, `el.checked`, `el.className` — DOM **properties** (live state)
- `classList.add/remove/toggle/contains`
- `dataset.userId` ↔ `data-user-id`

**Batch DOM work** with a `DocumentFragment` so you attach many nodes in one insert.

---

## Events: Capturing, Target, Bubbling — very important

### How does event propagation work? — very important

For most events the path is:

1. **Capture** phase — window → document → ancestors → parent
2. **Target** phase — the element that was the event target
3. **Bubble** phase — target → parent → … → document → window

```javascript
parent.addEventListener("click", handler, true);  // capture
parent.addEventListener("click", handler, false); // bubble (default)
parent.addEventListener("click", handler, { capture: true, once: true, passive: true });
```

`event.target` — the deepest node that was hit.  
`event.currentTarget` — the node whose listener is running now.  
`event.eventPhase` — `CAPTURING_PHASE` / `AT_TARGET` / `BUBBLING_PHASE`.

Some events **do not bubble** (`focus`, `blur`, `load`, `mouseenter` / `mouseleave`). Use `focusin` / `focusout` if you need focus to bubble. `mouseover` bubbles; `mouseenter` does not.

The listener on the target runs in the target phase (both capture and bubble listeners on the target fire there; order is registration order in modern browsers).

---

## Event Delegation - advanced topic

### What is event delegation and why use it?

Put **one listener on a common ancestor** and use `event.target` (or `closest`) to see which child was involved. You do not attach a listener per row.

```javascript
table.addEventListener("click", (event) => {
  const button = event.target.closest("button.delete");
  if (!button || !table.contains(button)) return;
  deleteRow(button.closest("tr"));
});
```

Why interviewers like it:

- Works for **rows added later**
- Fewer listeners, less memory
- One place to handle a pattern (lists, menus, tables)

Caveats: the event must **bubble** (or you listen in capture). `closest` is safer than `event.target` because the click may be on a nested `<span>` inside the button.

---

## `preventDefault` and `stopPropagation`

### How do they differ?

`**event.preventDefault()**` — cancel the **browser’s default action**: following a link, submitting a form, checking a checkbox, typing in a field, context menu, etc. The event **still propagates**.

`**event.stopPropagation()**` — stop the event from reaching **other listeners on ancestors** (and remaining capture/bubble path). Default action **can still happen**.

`**event.stopImmediatePropagation()**` — also skip **other listeners on the same node**.

```javascript
form.addEventListener("submit", (event) => {
  event.preventDefault(); // stay on the page; run JS validation / fetch
});

link.addEventListener("click", (event) => {
  event.stopPropagation(); // parent click handlers will not run
  // the browser may still navigate unless you also preventDefault
});
```

`event.defaultPrevented` is true after `preventDefault`. For **passive** listeners (`{ passive: true }`, common on `touchstart` / `wheel` for scroll performance), calling `preventDefault` is ignored and may warn.

`return false` in `onclick` HTML / jQuery does both preventDefault and stopPropagation; in `addEventListener` a `return false` does **not**.

---

## Reflow, Repaint, and Compositing - important

### What is the rendering pipeline after a DOM change?

Rough pipeline:

1. **JavaScript** mutates DOM/CSSOM
2. **Style** — compute used styles
3. **Layout (reflow)** — geometry: size, position
4. **Paint (repaint)** — fill pixels into layers (text, colors, borders, shadows)
5. **Composite** — GPU combines layers (transform, opacity, and similar)

**Reflow** is the expensive geometry pass. Changing width, height, font, adding/removing DOM, reading layout-forcing properties after writes — all can reflow.

**Repaint** redraws pixels without necessarily relaying out (e.g. `color`, `background-color` on a box whose size did not change).

**Compositing** can animate `transform` and `opacity` on their own layer **without** layout or paint of the whole document. That is why `transform: translateX` is preferred over `left` for animation.

### What is layout thrashing? - important

Interleaving **writes** and **reads** of layout:

```javascript
el.style.width = "100px";
const w = el.offsetWidth; // forces layout now
el.style.height = "50px";
const h = el.offsetHeight; // layout again
```

Batch **all writes**, then **all reads** (or use `requestAnimationFrame`). Properties that flush layout include `offsetWidth/Height`, `clientWidth`, `getBoundingClientRect()`, `scrollTop` (when dirty).

Minimize reflow: change classes once, use `transform`, avoid querying layout in loops, `content-visibility`, virtualize long lists. - best practice (pattern good to know)

---

## Critical Rendering Path - good to know

### What is the Critical Rendering Path (CRP)?

The work to get **the first pixels of the initial view** on screen:

1. **HTML** → bytes → **DOM**
2. **CSS** → bytes → **CSSOM**
3. DOM + CSSOM → **render tree** (visible nodes with styles; no `display: none`)
4. **Layout** → **paint** → **composite**

**JS** (`<script>` without `async`/`defer`) **blocks HTML parsing**. **CSS** is render-blocking: the browser typically waits for the CSSOM before first paint so it does not flash unstyled content.

Optimize CRP:

- Send less HTML/CSS/JS; compress; HTTP/2 or HTTP/3
- Critical CSS inlined or small; rest deferred
- `<script defer>` (order preserved, runs after DOM parse) or `type="module"` (deferred by default); `async` for independent scripts
- Preload hero font/image: `<link rel="preload">`
- Images: `width`/`height` or `aspect-ratio`, `srcset`, lazy-load below the fold (`loading="lazy"`)
- Avoid `@import` in CSS (extra round trip)

**First paint** ≠ **usable page**. See Core Web Vitals below.

---

## Cookies, `localStorage`, `sessionStorage`, IndexedDB

### How do you choose a storage API? - veryu important


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

`**localStorage` / `sessionStorage**` — `setItem` / `getItem` / `removeItem`; **strings only** (`JSON.stringify`). Same-origin. Sync and can **block** the main thread on large data. `storage` event fires in **other** tabs for `localStorage`.

**IndexedDB** — large structured data, indexes, transactions, async. Use for offline caches, drafts, large client DBs. Wrappers (idb) hide the verbose API.

**Do not** put secrets or access tokens in `localStorage` (any XSS reads them). Prefer memory or `HttpOnly` cookies for session.

---

## `fetch` vs `XMLHttpRequest`

### What are the main differences?

`**fetch**`

- Promise-based; pairs with `async/await`
- Request/response are **streamable** (`body` is a `ReadableStream`)
- `AbortController` to cancel
- **Does not reject** on HTTP 404/500 — only on network failure or abort. Check `response.ok` / `status`
- No progress events for upload/download in the basic API (XHR has `progress`; for fetch, Streams / extra APIs)
- Cookies: `credentials: "same-origin"` default; `"include"` for CORS with cookies
- Cannot easily observe **request** progress the way XHR `upload.onprogress` does

`**XMLHttpRequest**`

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

Interview one-liner: **prefer `fetch` today; know XHR for progress and legacy code; neither is a WebSocket.**

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
- Can **intercept `fetch`**, cache responses, enable **offline**, push notifications, background sync
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

`**private` vs `public**` — whether shared caches (CDN) may store.

**Heuristic caching** exists if the server sends little cache info; do not rely on it.

HTML is often `no-cache` or short `max-age` so users get new asset **URLs**. Assets get **content hashes** and long `max-age`.

Other layers: memory cache, disk HTTP cache, **Service Worker cache**, bfcache (`pageshow` / `pagehide`, `event.persisted`) for back/forward.

`fetch` / XHR: default cache mode follows HTTP rules; `cache: "no-store"` bypasses.

---

## Core Web Vitals: LCP, INP, CLS

### What do LCP, INP, and CLS measure?

Google’s field metrics for **loading**, **interactivity**, and **visual stability**.

**LCP (Largest Contentful Paint)** — when the largest above-the-fold image or text block appears. Aim **≤ 2.5 s** (good). Improve: faster TTFB, preload hero image, don’t wait on huge JS, sized images, CDN.

**INP (Interaction to Next Paint)** — replaced FID. Latency from click/key/tap until the **next paint** that reflects the interaction (input delay + processing + present). Aim **≤ 200 ms**. Improve: break up long tasks, fewer hydration costs, workers for heavy JS, avoid layout thrash in handlers.

**CLS (Cumulative Layout Shift)** — how much visible content **jumps**. Aim **≤ 0.1**. Improve: `width`/`height` on images and embeds, reserve space for ads/fonts (`font-display`, fallback metrics), don’t inject DOM above existing content.

Say **field data** (CrUX, RUM) vs **lab** (Lighthouse): lab is a phone simulation; vitals for ranking/UX are field.

Related: TTFB, FCP, TTI (older), TBT in lab as a proxy for main-thread blocking.

---

## Performance and Memory in DevTools

### What do you actually open in an interview / on the job?

**Performance (timeline)**

- Record a load or an interaction
- See **Main** thread: Evaluate script, Recalculate style, Layout, Paint, Commit
- Long tasks (red triangles / tasks > 50 ms)
- **INP-style** debugging: click the interaction, see handler duration
- FPS, layers, `requestAnimationFrame`

**Network**

- Waterfall, blocking vs async scripts, TTFB vs download
- Disable cache while DevTools is open
- `Priority`, initiator, headers (`cache-control`)

**Lighthouse / Performance insights**

- Lab scores, CRP opportunities, unused JS/CSS

**Rendering** (more tools)

- Paint flashing, layout shift regions (CLS), FPS meter, layer borders

**Memory**

- **Heap snapshot** — retained size, detached DOM nodes, comparison after actions
- **Allocation instrumentation** — who allocates over time
- **Performance monitor** — JS heap, DOM nodes, listeners live

Typical leaks: detached nodes still referenced in a Map, uncleared `setInterval`, global caches, closures over large data, listeners on `document` never removed.

**Application** panel — storage, service workers, cache storage, unregister SW.

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

### Why does `querySelectorAll` not update when you add nodes?

It returns a **static** `NodeList`. `getElementsByClassName` returns a **live** collection. Live lists can surprise you in loops that mutate the DOM.

### Does `stopPropagation` stop the default?

No. Use `preventDefault` for defaults. You often need **both** on a nested control inside a clickable row.

### Why is `left` animation worse than `transform`?

`left` triggers **layout** (and usually paint). `transform` can stay on the **compositor** if the element is on its own layer.

### Why does `fetch` “succeed” on 500?

The network succeeded. HTTP errors are still `Response` objects. Check `res.ok`.

### Cookie vs `localStorage` for a token?

If it must go to the server automatically, cookie (with `Secure`, `HttpOnly`, `SameSite`). If XSS is in scope, `localStorage` is readable by the attacker’s script. Neither replaces server-side session design.