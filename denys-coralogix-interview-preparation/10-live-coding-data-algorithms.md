# Data Tasks in TypeScript — Observability Flavour

Framework-free tasks that match the domain. Interviewers at observability companies like these because they mirror real code: bucketing, trees, parsing, aggregation. Classic utilities (debounce, throttle, LRU, promise pool, deep clone) are already in [js-ts-utilities/](../danil-interview-preparation/live-coding-tasks/js-ts-utilities/) — do those too if you haven't.

For each: clarify input/edge cases → state complexity → code → walk through a test.

- [ ] 1. Histogram buckets (25 min)
- [ ] 2. Span tree and waterfall layout (35 min)
- [ ] 3. Search query parser (35 min)
- [ ] 4. Safe search-term highlighting (20 min)
- [ ] 5. Percentiles and min/max downsampling (25 min)
- [ ] 6. Merge sorted log streams (20 min)
- [ ] 7. Error grouping by fingerprint (25 min)
- [ ] 8. Relative time expressions (20 min)

---

## 1. Histogram buckets (25 min)

Given logs `{ timestamp: number; severity: Severity }[]` and a range `[from, to)`, return ~`targetBuckets` buckets with counts per severity. Bucket size must be a "nice" interval (1s, 5s, 10s, 30s, 1m, 5m, 10m, 30m, 1h, 3h, 12h, 1d). Empty buckets must exist (charts need zeros, not gaps).

<details>
<summary>Solution</summary>

```ts
const NICE_MS = [1, 5, 10, 30, 60, 300, 600, 1800, 3600, 10800, 43200, 86400].map(s => s * 1000);

export function pickBucketMs(from: number, to: number, target = 60): number {
  const raw = (to - from) / target;
  return NICE_MS.find(ms => ms >= raw) ?? NICE_MS[NICE_MS.length - 1];
}

type Bucket = { start: number; counts: Record<Severity, number>; total: number };

export function histogram(logs: { timestamp: number; severity: Severity }[], from: number, to: number, target = 60): Bucket[] {
  const size = pickBucketMs(from, to, target);
  const first = Math.floor(from / size) * size;            // align to wall clock, stable across refreshes
  const n = Math.ceil((to - first) / size);
  const buckets: Bucket[] = Array.from({ length: n }, (_, i) => ({
    start: first + i * size,
    counts: { debug: 0, info: 0, warning: 0, error: 0, critical: 0 },
    total: 0,
  }));

  for (const l of logs) {
    if (l.timestamp < from || l.timestamp >= to) continue;
    const b = buckets[Math.floor((l.timestamp - first) / size)];
    b.counts[l.severity]++;
    b.total++;
  }
  return buckets;
}
```

O(n + buckets). Talking points: aligned buckets so the chart doesn't "shift" on refresh; partial first/last bucket (mark visually or normalize); in production the server buckets — the client only does this for live-tail data; timezones matter for day buckets.

</details>

---

## 2. Span tree and waterfall layout (35 min)

Input: flat spans `{ spanId, parentSpanId?: string, name, service, start, duration }` in random order. Output: rows for a waterfall in depth-first order (children sorted by start), each with `depth`, `offsetPct`, `widthPct`. Support collapsed span ids. Handle orphans (parent missing) as additional roots.

<details>
<summary>Solution</summary>

```ts
interface Span { spanId: string; parentSpanId?: string; name: string; service: string; start: number; duration: number }
interface Row { span: Span; depth: number; offsetPct: number; widthPct: number; hasChildren: boolean; orphan: boolean }

export function buildWaterfall(spans: Span[], collapsed: ReadonlySet<string> = new Set()): Row[] {
  if (!spans.length) return [];
  const byId = new Map(spans.map(s => [s.spanId, s]));
  const children = new Map<string, Span[]>();
  const roots: Span[] = [];

  for (const s of spans) {
    if (s.parentSpanId && byId.has(s.parentSpanId)) {
      const list = children.get(s.parentSpanId) ?? [];
      list.push(s);
      children.set(s.parentSpanId, list);
    } else {
      roots.push(s);
    }
  }

  const traceStart = Math.min(...spans.map(s => s.start));
  const traceEnd = Math.max(...spans.map(s => s.start + s.duration));
  const total = Math.max(1, traceEnd - traceStart);
  const byStart = (a: Span, b: Span) => a.start - b.start;

  const rows: Row[] = [];
  const visited = new Set<string>();
  const stack: { span: Span; depth: number }[] = roots.sort(byStart).reverse().map(span => ({ span, depth: 0 }));

  while (stack.length) {
    const { span, depth } = stack.pop()!;
    if (visited.has(span.spanId)) continue;                 // guards against cycles in bad data
    visited.add(span.spanId);
    const kids = children.get(span.spanId) ?? [];
    rows.push({
      span,
      depth,
      offsetPct: ((span.start - traceStart) / total) * 100,
      widthPct: Math.max(0.1, (span.duration / total) * 100),
      hasChildren: kids.length > 0,
      orphan: depth === 0 && !!span.parentSpanId,
    });
    if (!collapsed.has(span.spanId)) {
      for (const k of [...kids].sort(byStart).reverse()) stack.push({ span: k, depth: depth + 1 });
    }
  }
  return rows;
}
```

O(n log n) due to sorting. Talking points: iterative DFS (no stack overflow on deep traces); `Math.min(...spans)` can overflow the call stack for >100k items — use a loop at that scale; min width so tiny spans stay clickable; clock skew (child starts before parent) → flag it; for 50k spans run in a Web Worker and virtualize rows; collapsed state is just a Set, so toggling is cheap to recompute.

</details>

---

## 3. Search query parser (35 min)

Parse a simplified Lucene-like query into structured filters:

```
severity:error service:"api gateway" -env:dev timeout "connection reset"
```

→

```ts
[
  { type: 'field', field: 'severity', value: 'error', negate: false },
  { type: 'field', field: 'service', value: 'api gateway', negate: false },
  { type: 'field', field: 'env', value: 'dev', negate: true },
  { type: 'text', value: 'timeout', negate: false },
  { type: 'text', value: 'connection reset', negate: false },
]
```

Report errors with a position for unclosed quotes. Also write `serialize(filters)` so the UI can round-trip (facet click → query text).

<details>
<summary>Solution</summary>

```ts
type Term =
  | { type: 'field'; field: string; value: string; negate: boolean }
  | { type: 'text'; value: string; negate: boolean };

type ParseResult = { ok: true; terms: Term[] } | { ok: false; error: string; position: number };

export function parseQuery(input: string): ParseResult {
  const terms: Term[] = [];
  let i = 0;

  const readValue = (): string | { error: string; position: number } => {
    if (input[i] === '"') {
      const start = i++;
      let out = '';
      while (i < input.length && input[i] !== '"') {
        if (input[i] === '\\' && i + 1 < input.length) i++;
        out += input[i++];
      }
      if (input[i] !== '"') return { error: 'Unclosed quote', position: start };
      i++;
      return out;
    }
    const start = i;
    while (i < input.length && !/\s/.test(input[i])) i++;
    return input.slice(start, i);
  };

  while (i < input.length) {
    if (/\s/.test(input[i])) { i++; continue; }

    const negate = input[i] === '-';
    if (negate) i++;

    const fieldMatch = /^([A-Za-z_][\w.]*):/.exec(input.slice(i));
    if (fieldMatch) {
      i += fieldMatch[0].length;
      const value = readValue();
      if (typeof value !== 'string') return { ok: false, ...value };
      if (!value) return { ok: false, error: `Missing value for ${fieldMatch[1]}`, position: i };
      terms.push({ type: 'field', field: fieldMatch[1], value, negate });
    } else {
      const value = readValue();
      if (typeof value !== 'string') return { ok: false, ...value };
      if (value) terms.push({ type: 'text', value, negate });
    }
  }
  return { ok: true, terms };
}

const quote = (v: string) => (/[\s"]/.test(v) || v === '' ? `"${v.replace(/(["\\])/g, '\\$1')}"` : v);

export function serialize(terms: Term[]): string {
  return terms
    .map(t => (t.negate ? '-' : '') + (t.type === 'field' ? `${t.field}:${quote(t.value)}` : quote(t.value)))
    .join(' ');
}
```

Test: `serialize(parse(q).terms)` should equal a normalized `q` — a great property-based test. Talking points: hand-written scanner is easier to give good error positions (for squiggly underline in the editor); real languages (DataPrime) need a proper grammar (Lezer/ANTLR/Chevrotain) and incremental parsing for autocomplete; follow-ups: `AND/OR`, parentheses, ranges `duration:>500`, wildcards.

</details>

---

## 4. Safe search-term highlighting (20 min)

`segments(text, terms)` → `{ text: string; match: boolean }[]` so the template can render `<mark>` without `innerHTML`. Case-insensitive, multiple terms, overlapping matches merged, terms may contain regex characters (`a.b*`).

<details>
<summary>Solution</summary>

```ts
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function segments(text: string, terms: string[]): { text: string; match: boolean }[] {
  const clean = terms.map(t => t.trim()).filter(Boolean);
  if (!clean.length || !text) return [{ text, match: false }];

  const re = new RegExp(clean.map(escapeRe).join('|'), 'gi');
  const ranges: [number, number][] = [];
  for (const m of text.matchAll(re)) {
    const start = m.index!;
    const end = start + m[0].length;
    const last = ranges[ranges.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else ranges.push([start, end]);
  }

  const out: { text: string; match: boolean }[] = [];
  let pos = 0;
  for (const [s, e] of ranges) {
    if (s > pos) out.push({ text: text.slice(pos, s), match: false });
    out.push({ text: text.slice(s, e), match: true });
    pos = e;
  }
  if (pos < text.length) out.push({ text: text.slice(pos), match: false });
  return out;
}
```

```html
@for (seg of segments(); track $index) {
  @if (seg.match) { <mark>{{ seg.text }}</mark> } @else { {{ seg.text }} }
}
```

Note: regex alternation only finds non-overlapping matches left to right; to merge truly overlapping terms (`"abc"` and `"bcd"` in `"abcd"`) run one regex per term and merge sorted ranges. Talking points: log content is untrusted → never `innerHTML`; compute segments only for visible rows (virtual scroll) or in a pure pipe; long lines → cap length.

</details>

---

## 5. Percentiles and min/max downsampling (25 min)

a) `percentile(values, p)` for p50/p95/p99 (nearest-rank or linear interpolation — say which).
b) `downsampleMinMax(points, buckets)` — reduce `{ t, v }[]` to at most `2 * buckets` points keeping each bucket's min and max (preserves spikes).

<details>
<summary>Solution</summary>

```ts
export function percentile(values: number[], p: number): number | undefined {
  if (!values.length) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);             // linear interpolation
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (rank - lo);
}

export function downsampleMinMax(points: { t: number; v: number }[], buckets: number) {
  if (points.length <= buckets * 2) return points;
  const size = points.length / buckets;
  const out: { t: number; v: number }[] = [];
  for (let b = 0; b < buckets; b++) {
    const start = Math.floor(b * size);
    const end = Math.floor((b + 1) * size);
    let min = points[start];
    let max = points[start];
    for (let i = start + 1; i < end; i++) {
      if (points[i].v < min.v) min = points[i];
      if (points[i].v > max.v) max = points[i];
    }
    if (min === max) out.push(min);
    else out.push(...(min.t < max.t ? [min, max] : [max, min]));
  }
  return out;
}
```

Talking points: `[...values].sort` — never mutate input; `sort()` without a comparator sorts numbers as strings (classic bug); percentiles can't be averaged across buckets/hosts — backends use sketches (t-digest, DDSketch, HDR histograms) for mergeable percentiles; averaging when downsampling hides incidents, which is why min/max (or LTTB) is used.

</details>

---

## 6. Merge sorted log streams (20 min)

Given `k` arrays of logs each sorted by timestamp descending (from different shards/services), return one array sorted descending, optionally limited to `limit`.

<details>
<summary>Solution</summary>

```ts
export function mergeSorted<T extends { timestamp: number }>(lists: T[][], limit = Infinity): T[] {
  const idx = lists.map(() => 0);
  const out: T[] = [];
  while (out.length < limit) {
    let best = -1;
    for (let k = 0; k < lists.length; k++) {
      const item = lists[k][idx[k]];
      if (item && (best === -1 || item.timestamp > lists[best][idx[best]].timestamp)) best = k;
    }
    if (best === -1) break;
    out.push(lists[best][idx[best]++]);
  }
  return out;
}
```

O(N·k); with a heap O(N log k) — mention it, implement the heap only if asked. Talking points: ties → tie-break by id for stable pagination; this is exactly how paginated results from multiple shards combine, and why cursors are `(timestamp, id)`.

</details>

---

## 7. Error grouping by fingerprint (25 min)

RUM collects errors like:

```
"Cannot read properties of undefined (reading 'id') at /static/js/main.4f3a2.js:1:2345"
"Request to /api/users/123 failed with 500"
"Request to /api/users/987 failed with 500"
```

Group them: normalize variable parts (numbers, UUIDs, hex hashes, URLs' ids, quoted strings), return groups sorted by count with first/last seen and a sample.

<details>
<summary>Solution</summary>

```ts
interface ErrorEvent { message: string; timestamp: number; sessionId: string }

export function fingerprint(message: string): string {
  return message
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<uuid>')
    .replace(/\b[0-9a-f]{6,}\b/gi, '<hex>')
    .replace(/\d+/g, '<n>')
    .replace(/'[^']*'|"[^"]*"/g, '<str>')
    .trim();
}

export function groupErrors(events: ErrorEvent[]) {
  const groups = new Map<string, { fingerprint: string; count: number; sessions: Set<string>; firstSeen: number; lastSeen: number; sample: string }>();
  for (const e of events) {
    const fp = fingerprint(e.message);
    const g = groups.get(fp);
    if (g) {
      g.count++;
      g.sessions.add(e.sessionId);
      g.firstSeen = Math.min(g.firstSeen, e.timestamp);
      g.lastSeen = Math.max(g.lastSeen, e.timestamp);
    } else {
      groups.set(fp, { fingerprint: fp, count: 1, sessions: new Set([e.sessionId]), firstSeen: e.timestamp, lastSeen: e.timestamp, sample: e.message });
    }
  }
  return [...groups.values()]
    .map(g => ({ ...g, affectedSessions: g.sessions.size }))
    .sort((a, b) => b.count - a.count);
}
```

Talking points: order of replacements matters (UUID before hex before numbers); real products fingerprint on **stack trace frames** (after source-mapping) + error type, not only the message; "affected users/sessions" is often more important than raw count for prioritization — a product-thinking point.

</details>

---

## 8. Relative time expressions (20 min)

Parse `now`, `now-15m`, `now-2h`, `now-7d`, `now-1w`, and `now-1d/d` (rounded to start of day, UTC) into epoch ms. Invalid input → `null`.

<details>
<summary>Solution</summary>

```ts
const UNIT_MS = { s: 1e3, m: 6e4, h: 36e5, d: 864e5, w: 6048e5 } as const;

export function parseRelative(expr: string, now = Date.now()): number | null {
  const m = /^now(?:([+-])(\d+)([smhdw]))?(?:\/([smhdw]))?$/.exec(expr.trim());
  if (!m) return null;
  const [, sign, amount, unit, round] = m;
  let t = now;
  if (sign) t += (sign === '-' ? -1 : 1) * Number(amount) * UNIT_MS[unit as keyof typeof UNIT_MS];
  if (round) {
    const size = UNIT_MS[round as keyof typeof UNIT_MS];
    t = Math.floor(t / size) * size;
  }
  return t;
}
```

Talking points: inject `now` for testability; rounding weeks to epoch multiples isn't "start of week" (epoch started on Thursday) — real implementation uses calendar math in the user's timezone; DST makes "1d" ≠ 24h in local time; that's why many observability tools default to UTC display options.

</details>
