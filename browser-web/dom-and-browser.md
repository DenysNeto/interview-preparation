# JavaScript Interview Study Guide: DOM, Events, and Rendering

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

**Create / insert / remove**

```javascript
const li = document.createElement("li");
li.textContent = "Two";
ul.append(li);          // also prepend, before, after
li.remove();
el.replaceWith(other);
```

**Prefer** `textContent` **for plain text (no HTML parse).** `innerHTML` **parses markup and is an XSS footgun with untrusted strings.** `insertAdjacentHTML` **is the same risk. - important for security**

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

Capture is the walk **toward** the target. Target is the destination. Bubble is the walk **back out**.

Target is a separate phase because:

- The event’s **destination** is not an ancestor step
- Capture-registered and bubble-registered listeners on the target both run **here** (`AT_TARGET`)
- Some events never bubble, but they still run listeners on the target
- On the target, **capture listeners run before non-capture listeners**. Both report `AT_TARGET`. Listeners with the same `capture` value still run in registration order.

```javascript
parent.addEventListener("click", handler, true);  // capture
parent.addEventListener("click", handler, false); // bubble (default)
parent.addEventListener("click", handler, { capture: true, once: true, passive: true });
```

`event.target` — the deepest node that was hit.  
`event.currentTarget` — the node whose listener is running now.  
`event.eventPhase` — `CAPTURING_PHASE` / `AT_TARGET` / `BUBBLING_PHASE`.

**Some events do not bubble** (`focus`, `blur`, `load`, `mouseenter` / `mouseleave`). Use `focusin` / `focusout` if you need focus to bubble. `mouseover` bubbles; `mouseenter` does not. — important

### What do the `addEventListener` options mean?

The third argument is either a **boolean** (`useCapture`) or an **options object**. The boolean is the old form of `capture` only.

```javascript
element.addEventListener(type, listener, useCapture);
element.addEventListener(type, listener, {
  capture: false,
  once: false,
  passive: false,
  signal, // AbortSignal
});
```

**`capture`** (default `false`) — which trip the listener is on.

- `false` — bubble phase (or target, if this node *is* the target)
- `true` — capture phase (or target, if this node *is* the target)

The same function can be registered twice, once per phase. They are **two listeners**:

```javascript
el.addEventListener("click", onClick, true);
el.addEventListener("click", onClick, false);
// both run if el is on the path; at the target both run in target phase
```

`removeEventListener` must match **the same function reference and the same `capture` value**. `once` / `passive` / `signal` do not identify the listener.

```javascript
el.addEventListener("click", onClick, { capture: true });
el.removeEventListener("click", onClick);              // misses it (capture defaults to false)
el.removeEventListener("click", onClick, { capture: true }); // removes
```

**`once`** — run at most one time, then the browser removes the listener. Useful for “first click”, one-shot load, or a promise that waits for an event.

```javascript
button.addEventListener("click", onSubmit, { once: true });
```

**`passive: true`** — you promise **not** to call `preventDefault()`. The browser can start scrolling/zooming immediately instead of waiting to see if JS will cancel the default. That is why Chrome treats `touchstart` / `touchmove` / `wheel` on `document`/`window` as passive by default.

```javascript
window.addEventListener("wheel", onWheel, { passive: true }); // scroll stays smooth
window.addEventListener("touchstart", onTouch, { passive: false }); // can preventDefault (jank risk)
```

Calling `preventDefault()` inside a passive listener is ignored (and may warn). Use `passive: false` only when you actually need to block scroll or swipe.

**`signal`** — `AbortSignal`. When you abort, the listener is removed. Same idea as cancelling `fetch`.

```javascript
const controller = new AbortController();
el.addEventListener("click", onClick, { signal: controller.signal });
controller.abort(); // listener gone; no need to keep the function reference
```

### When would you use each option in practice?

Default (`capture: false`) is what you want **most of the time**: button clicks, form submit, event **delegation** on a list. The inner node is already `event.target` by the time the parent handler runs.

**`capture: true`** — run before the target (and before bubbling widgets).

Use it when an ancestor must **see or stop** the event first:

- Global shortcuts / “click outside” that must run even if a child calls `stopPropagation` on the way up (capture on `document` still runs **before** that child)
- A modal overlay that should swallow clicks before they hit the page underneath
- Analytics / debug logging of every click before app handlers
- Focus traps and `focusin` in capture if you need to catch focus as it enters a subtree

```javascript
document.addEventListener(
  "click",
  (event) => {
    if (!dropdown.contains(event.target)) closeDropdown();
  },
  true
);
```

Do **not** use capture for normal delegation unless you have a reason. It is harder to reason about than bubble + `closest`.

**`once: true`** — one-shot setup, then forget it.

- First visit tooltip / “got it” that should never fire again on that node
- Wait for `DOMContentLoaded` or a video `canplay` without removing the listener yourself
- Wrap an event in a Promise:

```javascript
function nextClick(el) {
  return new Promise((resolve) => {
    el.addEventListener("click", resolve, { once: true });
  });
}
```

- Prefetch or open a socket on the **first** user gesture (autoplay / clipboard policies)

**`passive: true`** — observe scroll/touch without blocking the browser.

- Scroll-spy, parallax, “how far did we scroll”, lazy-load sentinels — you only **read** `scrollY` / `touch` position
- `wheel` / `touchmove` listeners on `window` or a long list — keeps 60fps scrolling

```javascript
list.addEventListener("scroll", updateShadow, { passive: true });
```

Use `passive: false` only for custom pull-to-refresh, a map that must steal the swipe, or preventing pinch-zoom on a canvas. If you are not calling `preventDefault`, mark it **passive**.

**`signal`** — the listener’s lifetime is a component, a page, or a mode.

- React/Vue unmount: abort in `useEffect` cleanup instead of storing the function for `removeEventListener`
- One `AbortController` for **all** listeners of a modal (click, keydown, resize) — `abort()` on close
- Same signal as `fetch` so leaving the page cancels both the request and the UI listeners
- “Edit mode on” → attach; “edit mode off” → abort

```javascript
function bindModal(dialog) {
  const controller = new AbortController();
  const { signal } = controller;

  dialog.addEventListener("keydown", onEsc, { signal });
  document.addEventListener("click", onOutside, { capture: true, signal });

  return () => controller.abort();
}
```

You can combine them: `{ capture: true, once: true, signal }` is valid. Typical combo in a SPA: **`{ signal }`** on unmount, **`passive: true`** on scroll, **`capture: true`** only for outside-click / overlay.

Interview extras:

- Capture on `document` / `window` runs **before** target handlers — useful for logging, shortcuts, or “stop this click before the widget sees it.”
- Delegation usually uses the **bubble** default so the real `event.target` is already the inner node.
- `mouseenter` / `mouseleave` do not bubble, so delegation needs `mouseover` / `mouseout` (and extra filtering) or a listener on each node.

---

## Event Delegation — advanced topic

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

**`event.preventDefault()`** — cancel the **browser’s default action**: following a link, submitting a form, checking a checkbox, typing in a field, context menu, etc. The event **still propagates**.

**`event.stopPropagation()`** — stop the event from reaching **other listeners on ancestors** (and remaining capture/bubble path). Default action **can still happen**.

**`event.stopImmediatePropagation()`** — also skip **other listeners on the same node**.

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

---

## Reflow, Repaint, and Compositing — important

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

### What does each stage actually do?

The browser does not paint the DOM directly. It builds a **render tree** (visible nodes + computed style; `display: none` is out), then turns that into pixels.

```text
JS / CSS change
    → Style (which rules apply, computed values)
    → Layout (where each box is: x, y, width, height)
    → Paint (draw each layer: text, background, border, shadow, image)
    → Composite (GPU stacks layers: order, opacity, transform, scroll)
```

A later stage can run **without** an earlier one:

| You change | Style | Layout | Paint | Composite |
| --- | --- | --- | --- | --- |
| `width`, `height`, `margin`, `font-size`, DOM insert/remove | yes | yes | yes | yes |
| `color`, `background`, `box-shadow`, `visibility` | yes | no | yes | yes |
| `transform`, `opacity` (element already on its own layer) | yes | no | no | yes |

`visibility: hidden` still occupies layout space and can paint. `display: none` skips layout and paint. `opacity: 0` still participates in hit-testing unless you also disable pointer events.

**Style** is “which CSS wins and what are the used values.” It is cheaper than layout but not free: a huge stylesheet, or a selector that forces the engine to walk many nodes (`*` + complex descendant rules), shows up as **Recalculate Style** in DevTools.

**Layout (reflow)** answers geometry. One box’s size often depends on its parent, siblings, and text. Changing the document width, a font, or inserting a node near the top can **invalidate** a large subtree, not just that node. Percentage heights, tables, and floats are classic “layout is global” cases. Flex and grid are still layout; they are not compositor-only.

**Paint (repaint)** rasterizes into **layers** (bitmaps or display lists). Text, gradients, shadows, and images are paint. A color change on a box that did not move is paint without layout. Paint is still main-thread work and can be large if the layer is big.

**Composite** is the GPU combining those layers into the frame you see: stacking order, `opacity`, `transform`, some filters, and scrolling a layer that was already painted. If the pixels did not change, the GPU only moves or fades the layer. That is the cheap path for animation.

### What creates a layer, and why does that matter?

The browser **promotes** an element to its own compositor layer when it needs to, for example:

- `transform` other than `none` (including `translateZ(0)` / `translate3d` — the old “hack”)
- `opacity` < 1 in some cases, or an opacity animation
- `will-change: transform` or `will-change: opacity`
- `position: fixed` / `sticky` in many cases
- `<video>`, `<canvas>`, `<iframe>`, and CSS filters

A layer lets `transform` / `opacity` skip layout and paint **of that element’s pixels**. It does **not** make layout of the rest of the page free, and it costs **GPU memory**. Promoting everything (`will-change` on every card) can make scrolling worse, not better.

`will-change` is a hint for the **next** animation, not a permanent class on the whole tree. Add it just before the animation, remove it after.

### Which CSS properties hit which stage?

Say this grouping in an interview:

- **Layout:** `width`, `height`, `padding`, `margin`, `border-width`, `top`/`left` when `position` is not `static`, `font-size`, `display`, `flex-*`, `grid-*`, content that changes line breaks
- **Paint only:** `color`, `background-color`, `background-image`, `box-shadow`, `outline`, `border-color` (width unchanged)
- **Composite (if layered):** `transform`, `opacity`

Animating `left` or `width` means **layout every frame** (and usually paint). Animating `transform: translateX` means **composite every frame**. Same visual, different cost. That is also why a `transform` on an ancestor changes the containing block for `position: fixed` — the element is now in a transformed layer, not the viewport.

### How do you see this in DevTools?

Performance panel, Main thread:

- **Recalculate Style** — style
- **Layout** — reflow (purple)
- **Paint** — raster
- **Composite Layers** — GPU

A long purple **Layout** bar inside a click handler is usually thrashing or a forced synchronous layout. Rendering panel: **Paint flashing** (green) shows repaints; **Layer borders** shows compositor layers.

### What is layout thrashing? — important

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

## Critical Rendering Path — good to know

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

**First paint** ≠ **usable page**. See [Core Web Vitals](performance-and-devtools.md).

---

## Must-Explain Questions

### Why does `querySelectorAll` not update when you add nodes?

It returns a **static** `NodeList`. `getElementsByClassName` returns a **live** collection. Live lists can surprise you in loops that mutate the DOM.

### Does `stopPropagation` stop the default?

No. Use `preventDefault` for defaults. You often need **both** on a nested control inside a clickable row.

### Why is `left` animation worse than `transform`?

`left` triggers **layout** (and usually paint). `transform` can stay on the **compositor** if the element is on its own layer.

---

## Related guides

- [Storage, Auth, and Security](storage-auth-security.md) — cookies, tokens, CSRF, same-origin policy, CORS, and CSP
- [Networking and Browser APIs](networking-and-browser-apis.md) — HTTP, DNS, TLS, fetch, realtime APIs, workers, and caching
- [Performance and DevTools](performance-and-devtools.md) — Core Web Vitals and the Performance and Memory panels
