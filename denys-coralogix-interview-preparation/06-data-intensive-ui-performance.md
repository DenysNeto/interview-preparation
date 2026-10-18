# Data-Intensive UI Performance

The heart of this role: logs tables with millions of rows, traces with thousands of spans, charts with many series, live streaming. Browser basics (Core Web Vitals, rendering pipeline, DevTools, leaks) are in [browser-web/performance-and-devtools.md](../browser-web/performance-and-devtools.md) and [browser-web/dom-and-browser.md](../browser-web/dom-and-browser.md). This file focuses on **large data**.

---

## 1. The framework: where does time go?

When a data screen is slow, diagnose before fixing. Name the layers:

1. **Network** — payload size, number of requests, waterfalls, no compression, no pagination.
2. **Parsing / transformation** — `JSON.parse` of 20 MB, mapping/sorting on the main thread.
3. **Framework work** — change detection over too many bindings, re-creating DOM (missing `track`).
4. **DOM / layout / paint** — too many nodes, layout thrashing, expensive CSS.
5. **Memory** — retained arrays, detached nodes, growing caches → GC pauses.

Tools: Performance panel (long tasks, flame chart), Angular DevTools profiler (which components were checked and how long), Memory heap snapshots, `performance.mark/measure`, RUM in production (INP/long animation frames).

**Measure in production**: "time to first row", "query latency vs render latency", INP on the explore page. Fitting for an observability company — you'd use their own RUM.

## 2. Large lists and tables

**Don't render what you can't see.**

- **Virtual scrolling** (windowing): render only visible rows + buffer. Angular CDK:

```html
<cdk-virtual-scroll-viewport itemSize="28" class="viewport" minBufferPx="400" maxBufferPx="800">
  <cx-log-row *cdkVirtualFor="let log of logs(); trackBy: trackById" [log]="log" />
</cdk-virtual-scroll-viewport>
```

- Fixed row height is simplest and fastest. **Variable heights** (expanded log JSON, wrapped lines): measure and cache heights, use estimated heights + correct on render, or keep rows fixed and open details in a **side drawer** instead of inline expansion (often better UX anyway).
- Column virtualization for wide tables (hundreds of dynamic log fields).
- **Pagination vs infinite scroll vs virtual + windowed fetch:**
  - Server-side cursor pagination (`searchAfter` / timestamp+id cursor), not offset (offset is slow and unstable with new data arriving).
  - Fetch pages as the viewport approaches the end; cap in-memory rows (e.g. 10k) and tell the user to narrow the query.
- **Sorting/filtering** large sets server-side; client-side only within the loaded window.
- Sticky header, column resize with `transform` during drag and commit on mouseup.
- Keep row components **dumb + OnPush**, precompute display values (formatted time, severity color) once in the view model, not in template method calls.

## 3. Charts and time series

| Approach | Good for | Limits |
| --- | --- | --- |
| **SVG** (D3, many chart libs) | < ~a few thousand elements, interactivity per element, accessibility, CSS styling | DOM node per point → slow at scale |
| **Canvas 2D** (uPlot, ECharts canvas mode, Chart.js) | 10k–1M points, fast redraw | Manual hit testing, a11y must be added separately |
| **WebGL** (deck.gl, regl) | Millions of points, heatmaps | Complexity |

Techniques:

- **Downsample on the server** to roughly the pixel width (≈1–2 points per pixel). A 1200 px chart doesn't need 1M points. Use **min/max per bucket** (preserves spikes — critical for observability, averages hide incidents) or LTTB.
- Shared time axis + crosshair sync across charts (common APM feature) — sync via a shared signal, throttle to animation frames.
- Brush to zoom → updates time range in URL → refetch at higher resolution.
- Render charts outside Angular CD (Zone apps: `runOutsideAngular`), feed data through inputs, redraw on `requestAnimationFrame`.
- Many charts on a dashboard: `@defer (on viewport)`, `IntersectionObserver` to pause off-screen updates, limit concurrent queries.

## 4. Heavy computation off the main thread

- **Web Workers** for parsing big JSON, aggregations (facet counts over loaded rows), sorting, search highlighting over thousands of rows, building span trees. Angular CLI: `ng generate web-worker`.
- Transfer data efficiently: `postMessage` structured clone copies; use **Transferable** `ArrayBuffer`s for large numeric data.
- Comlink-style RPC wrapper to keep worker code ergonomic.
- **Chunking** when you can't use a worker: split work, yield with `scheduler.yield()` (where supported) / `setTimeout(0)` / `requestIdleCallback` to keep INP low.
- **Streaming parse**: `fetch` + `ReadableStream` + NDJSON — render first rows while the rest arrives.

## 5. Real-time / streaming data

- Transport: **WebSocket** (bi-directional, live tail with filters), **SSE** (server → client, simpler, auto-reconnect), polling (simple, cacheable).
- **Batch updates** (`bufferTime(100–250ms)` or rAF) — never trigger change detection per message.
- **Ring buffer** with max size; drop or summarize when overloaded ("showing latest 5,000; 12,345 dropped").
- **Pause on scroll**: if the user scrolls up, stop auto-scroll and show "↓ 132 new logs".
- **Backpressure**: tell the server to sample/filter instead of sending everything; let the user narrow the query.
- Reconnect with exponential backoff + jitter; resume from last cursor/timestamp; show connection status.

## 6. Angular-specific performance checklist

- `OnPush` everywhere; immutable data; signals for state.
- `track item.id` in every `@for` (and `trackBy` with `*ngFor`/`*cdkVirtualFor`).
- No functions in templates; use pure pipes / `computed`.
- `@defer` heavy, below-the-fold components; lazy routes; check bundle with `source-map-explorer` / esbuild metafile; budgets in `angular.json`.
- High-frequency events (`scroll`, `mousemove`, `resize`): in Zone apps run outside Angular; throttle with rAF; in zoneless apps it matters less but still avoid signal writes per pixel.
- Avoid huge `effect` chains; prefer `computed`.
- Detach change detection for a very hot component and call `detectChanges()` on rAF if necessary (last resort).
- Unsubscribe from long-lived streams; clean up chart instances and observers in `DestroyRef`.
- Zoneless to drop Zone.js overhead.

## 7. Network & data shape

- Ask the backend for **what the UI needs**: projected fields, aggregations computed server-side, histogram bucketed server-side.
- Separate cheap aggregate queries (histogram, counts) from expensive row queries → show something fast.
- Compression (gzip/brotli), HTTP/2 multiplexing, caching headers for static metadata.
- **Cancel** obsolete queries client-side *and* propagate cancellation to backend if supported (saves cluster cost — a cost-focused company appreciates this).
- Request dedup and caching for repeated metadata (service lists, field names for autocomplete).

## 8. Memory in long-lived sessions

Engineers leave Explore open for hours during incidents.

- Cap buffers, evict old pages (LRU cache by query key).
- Avoid closures retaining large arrays in subscriptions/timers.
- Destroy chart instances, remove listeners, disconnect `ResizeObserver`/`IntersectionObserver`.
- Watch heap growth with "Performance monitor" while live tail runs for 10 minutes.

## 9. Perceived performance & UX

- Skeletons with the right layout (no CLS), progressive results ("showing first 100 of ~2.3M"), optimistic UI for cheap actions.
- Show query progress and allow **cancel** for long queries.
- Keep previous results visible (dimmed) while the next query loads instead of a blank spinner.
- Keyboard shortcuts for power users (`/` focus search, `j/k` row navigation, `Esc` close drawer).

---

## Must-explain questions

Spoken answers. Say the opening line, then the beats. Stop when they nod; use "if they push" only when they ask for more.

1. A logs table with 1M results is slow. Walk me through how you'd investigate and fix it.
2. How does virtual scrolling work? What breaks with variable row heights?
3. SVG vs Canvas vs WebGL for a chart with 200k points?
4. How would you build a live tail at thousands of events per second?
5. When would you use a Web Worker, and what's the cost of `postMessage`?
6. Offset vs cursor pagination for logs that keep arriving?
7. How do you measure frontend performance in production and set a budget?

---

### 1. A logs table with 1M results is slow. Walk me through how you'd investigate and fix it.

**Opening.** I would not start by virtualizing. A million-row table is usually slow in more than one layer, and the fix depends on which layer dominates. I reproduce with a realistic query, then split the time.

**Beats.**

1. **Name the symptom.** Time to first row, jank while scrolling, slow filter, or the tab dying after ten minutes are different bugs. I record one slow run in the Performance panel and look at the Network waterfall next to it.
2. **Network.** A long wait-for-first-byte means the query is slow. A long download means the payload is huge. I compare transferred size with resource size: a big gap means compression is working, a small gap on a JSON body means it is not. Forty parallel calls means a fan-out. The result I expect on a naive screen: we asked the API for a million rows. That is the bug. The browser should never download a million logs.
3. **Parse.** A red long task inside `JSON.parse` or a `.map` that formats every row is main-thread work. A 20 MB body still has to be parsed after gzip inflates it.
4. **Framework.** Angular DevTools: how many components were checked. Missing `track`, function calls in the template, and default change detection show up as the table rebuilding on every scroll tick.
5. **DOM.** Node count in the Performance monitor. Tens of thousands of row nodes means we rendered the data instead of the viewport.
6. **Memory.** Heap snapshot after scrolling. Retained log arrays and detached row nodes show up as growth that continues after the paint looks fine.

**Fix, in leverage order.**

- **Send less.** Cursor pagination, projected fields (timestamp, severity, message, service — the JSON drawer loads on open), histogram and counts as a separate cheap query so the chart appears before the rows. Gzip the JSON. Cancel the previous query on the client and on the backend when the filter changes.
- **Hold less.** Windowed fetch as the viewport nears the end. Cap memory around 10k rows and say "showing 10,000 of ~1,000,000 — narrow the query." Sort and filter on the server; the client sorts only the loaded window.
- **Paint less.** Virtualize rows. Virtualize columns when a log has hundreds of fields. Fixed row height, details in a drawer. Rows are OnPush, tracked by id, with formatted time and severity color already on the view model.
- **Feel faster while the query runs.** Skeleton with the real row height, previous results stay on screen dimmed, "showing first 100 of ~1M" as soon as the first page arrives.

**Close.** Virtualization makes the loaded window scrollable. It does nothing for a 50 MB response or a 4-second query. The user-visible win is a first row in about a second and a stable scroll, with an honest count so they still trust that the other 999,000 exist.

---

### 2. How does virtual scrolling work? What breaks with variable row heights?

**Opening.** Virtual scrolling renders only the rows that intersect the viewport, plus a buffer. The scrollbar still represents the full list, because a spacer is as tall as every row would have been.

**Beats.** Assume 50,000 logs, row height 28px, viewport 700px. That is 25 visible rows. The viewport element is the scroll container.

- Total scroll height is `50_000 × 28`. An inner spacer (or a translated content box) is that tall, so the scrollbar thumb is honest.
- On scroll: `start = Math.floor(scrollTop / 28)`, `end = start + 25 + buffer`. Render `logs.slice(start, end)` and move that slice down with `transform: translateY(start * 28)`.
- The buffer (CDK's `minBufferPx` / `maxBufferPx`, a few hundred pixels) pre-renders just outside the viewport so a fast flick does not flash blank.
- `track log.id` reuses the same row components and swaps their data. Without a track key, every scroll tick destroys and recreates the DOM, which defeats the technique.
- Column virtualization is the same math on the x-axis when there are hundreds of dynamic fields.

CDK version: `cdk-virtual-scroll-viewport` with `itemSize="28"` and `*cdkVirtualFor`.

**What breaks with variable heights.** The formula `scrollTop / rowHeight` is O(1) only when every row is the same height. An expanded JSON row might be 28px or 400px.

- The offset of row 10,000 is the sum of every height above it. You no longer know where it sits until you have measured the rows before it.
- You estimate, render, measure, cache, then correct. The correction moves content that is already on screen, so the viewport jumps.
- Expanding one row changes the offset of every row below it. Scroll position anchored to "row index" lands on the wrong log.
- A cached-height approach stores a prefix-sum of measured heights and binary-searches it on scroll. That works, and it is slower and easier to get wrong (stale cache after a column resize, wrong estimate on first paint, scrollbar jitter).

**Close.** I keep the row fixed at one line and open the body in a side drawer. Same information, stable index math, and the user can keep their place in the list. I reach for measured variable heights only when the product truly needs inline expansion, and I cache heights by id so a re-render does not measure again.

---

### 3. SVG vs Canvas vs WebGL for a chart with 200k points?

**Opening.** I would not draw 200,000 points. A 1,200px chart has about 1,200 pixels, so the server should downsample to roughly one or two points per pixel. If the product really must plot the raw points, Canvas for a time series, WebGL for a scatter or heatmap. SVG is the wrong tool at that count.

**Beats.**

| | SVG | Canvas 2D | WebGL |
| --- | --- | --- | --- |
| What you pay | A DOM node per mark, or one path the browser still has to tessellate | One bitmap, redraw the frame | One canvas, GPU draws the points |
| Comfortable range | Up to a few thousand elements | Tens of thousands to about a million, as polylines | Millions of points, heatmaps |
| Strength | CSS, per-point events, accessibility, sharp at any zoom | Fast redraw, simple | Density the other two cannot touch |
| Cost at 200k | Layout and paint collapse; hit-testing 200k nodes is worse | Must hit-test yourself; accessibility is a separate DOM | Shaders, context loss, more code than a line chart needs |

**The observability-specific part.** Averaging each bucket hides the incident: a 1 ms spike in a 1-minute average disappears. Bucket with **min and max** (the band still shows the spike) or LTTB when the visual shape of a smooth series matters more than the extreme. Brushing a range writes the new time range to the URL and refetches at higher resolution, so zooming does not stretch 1,200 buckets across a 10-second window.

After downsampling, a single line of ~2,000 points can be one SVG path and that is fine. Two hundred thousand `<circle>` elements are not. Several series on one chart are still one canvas, redrawn on `requestAnimationFrame`, outside Angular change detection.

**If they push on interaction.** Canvas and WebGL have no per-point DOM. Hover uses the mouse x to look up the nearest bucket in the data, then draws the crosshair. A shared signal, throttled to animation frames, syncs that crosshair across the dashboard. Accessibility is a visually hidden summary or a data table of the buckets, plus keyboard zoom.

**Close.** Downsampling is the performance win and the correctness win: the chart stays honest about spikes and the browser stays interactive. Canvas is the default once a series is past a few thousand marks; WebGL is for density plots, not for a latency line.

---

### 4. How would you build a live tail at thousands of events per second?

**Opening.** At 2,000 logs a second the socket is allowed to be busy. The UI is not. I batch to about four renders a second, cap what I keep, and let the user freeze the viewport to read.

**Beats.**

1. **Transport.** WebSocket when the client sends filter changes, pause, and "sample down" on the same connection. SSE when the stream is one-way and I want browser reconnect plus `Last-Event-ID`. Polling is for a health tile every few seconds, not a tail.
2. **Batch.** `bufferTime(250)` turns 2,000 messages into four arrays of ~500. One signal write per batch. Empty windows are filtered out. In a Zone app the socket runs outside Angular, and only the flush re-enters. `switchMap` on the query closes the old socket when the filter changes.
3. **Render.** The list is virtualized, OnPush, tracked by id. Newest at the top.
4. **Cap.** A ring buffer, `slice(0, 5000)`. Past that, drop the oldest and show "showing latest 5,000 · 12,345 dropped." The pause buffer has the same cap, or a long pause becomes the leak.
5. **Pause on scroll.** At the top, follow. Scrolled up, stop prepending into the viewport and show "↓ 132 new logs." Click or scroll back to the top to flush. An explicit Pause button is the same state machine.
6. **Backpressure.** The ring buffer protects the tab. It does not protect the cluster. When the drop counter climbs, the client asks the server to sample or tells the user to narrow the query (`severity >= ERROR`). Pause can send `{ type: 'pause' }` so the server stops shipping bytes.
7. **Reconnect.** Exponential backoff capped around 30s, with jitter so a deploy does not bring every browser back in the same second. Resume with the last `(timestamp, id)` cursor. Show `Live`, `Reconnecting…`, or `Paused`. Say when the gap could not be filled.

```ts
messages$.pipe(
  bufferTime(250),
  filter(batch => batch.length > 0),
  scan((rows, batch) => [...batch.reverse(), ...rows].slice(0, 5000), [] as LogEntry[]),
);
```

**Close.** Batching adds up to 250 ms of latency, which nobody notices next to a frozen tab. Capping drops data on purpose; the UI has to say so, because a silent gap during an incident is worse than a slow screen.

---

### 5. When would you use a Web Worker, and what's the cost of `postMessage`?

**Opening.** I move work to a worker when it would be a long task on the main thread: parsing multi-megabyte JSON, facet counts, sorting or highlighting thousands of rows, building a span tree, downsampling a series. I keep the worker alive and I only pay `postMessage` when the payload is worth the copy.

**Beats.** The main thread does input, style, layout, paint, and change detection. A 50 ms task delays the next paint, which is INP. A worker is another thread with no DOM and no `window`. Angular: `ng generate web-worker`. A Comlink-style wrapper turns `postMessage` into async function calls so call sites stay readable.

**The cost.** `postMessage` structured-clones the payload. Serialization runs on the sender, then the other side deserializes. You pay CPU on both threads and you briefly hold two copies. Posting an array of 100,000 log objects can take as long as the work you were trying to move, and it still janks the main thread because the clone happens before the worker starts.

What makes it cheap or expensive:

- **Small message, heavy CPU** — good trade. Send a query plus a few thousand ids, let the worker crunch.
- **Huge object graph** — bad trade. Nested log documents clone slowly.
- **Transferable `ArrayBuffer`** — ownership moves, the sender's buffer becomes detached, the copy is essentially free. Fetch as `arrayBuffer()`, transfer it, parse JSON or walk typed columns inside the worker. Numeric series (`Float64Array` of timestamps and values) should travel this way.
- **Worker startup** — parsing the worker script is tens of milliseconds. Spawn once, reuse. Do not create a worker per keystroke.
- **What does not transfer** — functions, DOM nodes, class prototypes. You get plain data back.

`SharedArrayBuffer` is the exception that shares memory, and it needs cross-origin isolation. I would not reach for it in an interview answer unless they ask.

**When I skip the worker.** Work under a few milliseconds, where the clone costs more than the work. Anything that touches the DOM. And when the real fix is "don't ship 20 MB": pagination and projection beat a faster parser.

**If a worker is unavailable,** I chunk on the main thread and yield with `scheduler.yield()` or `setTimeout(0)` so each slice stays under 50 ms. Streaming NDJSON (`fetch` + `ReadableStream`) lets me paint the first rows before the body finishes, which a single `postMessage` of the whole document cannot.

**Close.** A worker protects INP only if the handoff is cheaper than the work. I transfer bytes, keep one worker for the session, and still prefer the server doing the aggregation when the dataset is bigger than the screen.

---

### 6. Offset vs cursor pagination for logs that keep arriving?

**Opening.** Offset pagination skips rows the database still has to walk, and it shifts under you when new logs arrive. A live log stream wants a cursor: "give me the next page after this timestamp and id."

**Beats.**

Offset is `LIMIT 50 OFFSET 100000`. To return rows 100,000–100,050 the store reads and discards the first 100,000. Page 1 is fast, page 2,000 is not. It also lies when the table is growing at the top. You loaded page 1. Fifty new logs arrive. Page 2's offset now points fifty rows later, so you skip a page, or you duplicate the boundary rows if you offset from a stale total. Users notice both during an incident.

A cursor is the last row you showed, as a sort key:

```text
WHERE (timestamp, id) < (:ts, :id)
ORDER BY timestamp DESC, id DESC
LIMIT 50
```

The index seeks to that pair. Cost stays proportional to the page, not to how deep you are. New logs insert above the cursor, so the next page does not move. The id is the tie-break because many logs share a millisecond. Elasticsearch `search_after` is this pattern. The same cursor resumes a live tail after reconnect.

**How the UI uses it.** First page has no cursor. Each response includes `nextCursor`. The virtual scroller fetches when the user is within a few screens of the end. I cap retained pages (around 10k rows) and drop the far end. Total hits is a separate, often approximate, query: "showing first 100 of ~2.3M." I do not derive the count by walking pages.

**Limits of cursors, said out loud.** You cannot jump to page 400 without a cursor that points there; logs do not need random page access. Changing the sort changes the cursor: the key must be the sort field plus a unique id. Rows deleted between fetches are simply absent, which is acceptable for logs.

**Close.** Offset is fine for a short, stable admin list where someone needs "page 3 of 4." For Explore, cursor pagination is what keeps infinite scroll correct while data is still arriving.

---

### 7. How do you measure frontend performance in production and set a budget?

**Opening.** I pick a few user-visible numbers, measure them on real sessions, and fail CI or page someone when they regress. Lab scores tell me where to look. They do not tell me whether Explore is fast on a customer's data.

**Beats.**

**What I measure for this product.**

- **Time to first row** — `performance.mark` at query start, at first byte, after parse, at first painted row. That splits "the query is slow" from "the client is slow," which is the split you need before arguing with the backend.
- **INP on Explore** — filter apply, open a log, keyboard row navigation. Target ≤ 200 ms at p75. A long task in the click handler is the usual cause.
- **LCP and CLS** on the entry shell. Skeletons reserve the real row height so the table does not jump. LCP matters less than time-to-first-row once the user is inside a query.
- **Live tail health** — dropped-event count, UI updates per second, JS heap after the tail has run. A leak does not show up in Lighthouse.

I report **p75 and p95**, split by route and by rough payload size. An average hides the incident query that returns 100k rows.

**Field vs lab.** RUM (here, the company's own product is the obvious tool) collects those marks from real browsers. Lighthouse and the Performance panel are where I confirm a regression with a recording. A lab laptop with 200 fixture rows will happily pass a table that dies on a real tenant.

**Budgets, three of them, each with an owner.**

1. **Bundle.** `angular.json` budget on the initial bundle, plus a CI check (source-map-explorer or the esbuild metafile) so a new chart library cannot land unnoticed. Heavy routes are lazy; charts and editors are deferred.
2. **Interaction.** RUM alert when Explore INP p75 crosses 200 ms for a sustained window, or when time-to-first-row p75 jumps week over week for the same query-size bucket.
3. **Runtime.** A synthetic or a manual soak: live tail for ten minutes, heap must plateau. This one is a release check, not a per-PR number.

**Close.** More than three budgets and nobody watches them. The ones I would actually defend in a review are time-to-first-row, INP on Explore, and initial bundle size — each tied to a user moment, not to a Lighthouse grade.
