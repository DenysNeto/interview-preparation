# JavaScript Interview Study Guide: Performance and DevTools

Concise, answer-first explanations you can say aloud in an interview. Use the examples when the interviewer asks you to go deeper.

Reflow, repaint, compositing, and layout thrashing are covered in [DOM, Events, and Rendering](dom-and-browser.md).

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

