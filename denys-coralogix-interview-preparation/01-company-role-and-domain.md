# Company, Role, and Observability Domain

Facts about Coralogix below are from public materials as of writing. **Verify on coralogix.com and recent news before the interview** — products and naming change fast.

---

## 1. Coralogix in 60 seconds

- Full-stack **observability platform**: logs, metrics, traces, security events (SIEM), APM, RUM, Kubernetes monitoring, AI observability.
- Founded in Israel (Tel Aviv), large R&D presence in Europe, including Kraków.
- **Key differentiator: "Streama"** — in-stream processing. Data is analyzed *as it is ingested* (parsing, enrichment, alerting, metrics-from-logs) instead of indexing everything first. Data is then stored in the **customer's own cloud object storage** (e.g. S3) in an open format, and queried from there.
- Result they sell: **lower cost** (marketing says up to ~70%) without losing visibility. Customers choose per data type how it's handled (frequent search vs monitoring vs compliance/archive tiers — "TCO Optimizer").
- **DataPrime** — their own piped query language (also supports Lucene and SQL-like querying). Example shape: `source logs | filter $m.severity == ERROR | groupby $l.applicationname aggregate count()`.
- AI: an AI agent/assistant for investigations ("Olly") and AI observability for LLM apps. Expect questions on how *you* use AI in development (the JD mentions it twice).

**Your one-liner to say back:** "Coralogix analyzes data in-stream and stores it in the customer's own storage, so customers get full observability for a fraction of the cost. On the frontend, the challenge is turning huge, high-cardinality data into fast, simple investigation flows."

## 2. What the squad owns

| Product | What the user does there | Frontend challenges |
| --- | --- | --- |
| **Explore** (logs / traces / events explorer) | Query, filter, see histogram over time, scroll results, open a log, pivot to related trace, save views, live tail | Query editor (autocomplete, syntax highlight), virtualized table with dynamic columns, facets with counts, time range state, URL shareability, streaming results, huge JSON payloads |
| **APM** | See services, latency/throughput/error rate, service map, drill into traces and spans | Charts with many series, percentiles, service dependency graph, trace waterfall with thousands of spans, correlation logs ↔ traces ↔ metrics |
| **RUM** (Real User Monitoring) | Monitor real browser sessions: page loads, Web Vitals, errors, user actions, session replay | Session timeline, replay player, error grouping, source-mapped stack traces, filters by browser/geo/version |

Since the squad owns RUM, you should also know how a RUM browser SDK works (see section 5).

## 3. Observability glossary (must be fluent)

**Three pillars**

- **Logs** — timestamped events, structured (JSON) or unstructured. Fields: timestamp, severity, application/subsystem (Coralogix terms), message, labels/metadata. High volume.
- **Metrics** — numeric time series: name + labels + (timestamp, value). Types: counter, gauge, histogram, summary. Cheap to store; aggregated.
- **Traces** — one request's path through services. A **trace** = tree of **spans**. Span: `traceId`, `spanId`, `parentSpanId`, service, operation name, start time, duration, status, attributes, events. Rendered as a **waterfall / Gantt**.

**Other terms**

| Term | Meaning |
| --- | --- |
| **OpenTelemetry (OTel)** | Vendor-neutral standard + SDKs + Collector for emitting logs/metrics/traces. Coralogix ingests OTel. |
| **Cardinality** | Number of unique label value combinations. High cardinality (userId, requestId as labels) explodes metric storage and makes facet UIs heavy. |
| **RED metrics** | Rate, Errors, Duration — the standard APM service view. |
| **USE metrics** | Utilization, Saturation, Errors — for resources (CPU, disk). |
| **Percentiles (p50/p95/p99)** | Latency is reported as percentiles, not averages; averages hide tail latency. |
| **Apdex** | User satisfaction score from latency thresholds. |
| **SLI / SLO / error budget** | Indicator (e.g. % requests < 300 ms), objective (99.9%), allowed failure budget. |
| **Service map** | Graph of services and calls between them, derived from spans. |
| **Correlation** | Jumping logs ↔ traces ↔ metrics using `traceId` and shared labels. A key UX feature. |
| **Live tail** | Streaming logs in real time (WebSocket/SSE). |
| **Sampling** | Head-based (decide at start) vs tail-based (decide after trace completes, keep errors/slow ones). |
| **Alerting** | Rules on logs/metrics: threshold, anomaly, ratio, "new value", flow alerts. |
| **SIEM** | Security info & event management: security logs, detections, compliance. |
| **MTTD / MTTR** | Mean time to detect / resolve. The product's job is to reduce these. |

## 4. How an observability UI query works (be ready to whiteboard)

1. User sets **time range** (relative `last 15m` or absolute) + **query** (DataPrime/Lucene) + **filters** (facets).
2. Frontend serializes this into URL (shareable) and calls the query API.
3. Backend streams or paginates results; separately returns **aggregations** (histogram buckets, facet counts).
4. UI renders histogram first (cheap) and the first page of rows; more rows load on scroll.
5. User refines: brush on histogram → new time range; click facet value → filter added; click row → detail with JSON, correlated trace.
6. Every interaction should cancel the in-flight query (`switchMap` / `AbortController`).

## 5. How a RUM SDK works (you may be asked; it's the product you'd own)

- Small script loaded early. Generates `sessionId` (stored in cookie/localStorage with inactivity timeout) and `viewId` per page/route change.
- Collects: **Web Vitals** (`PerformanceObserver` for LCP, CLS, INP via `event` entries), navigation & resource timing, **errors** (`window.onerror`, `unhandledrejection`, console errors), **user actions** (click delegation on `document`), network calls (patching `fetch`/`XMLHttpRequest`), SPA route changes (`history.pushState` patch + `popstate`).
- **Trace propagation:** adds a `traceparent` header (W3C Trace Context) to backend calls so frontend actions link to backend traces.
- **Session replay:** records DOM snapshots + mutations (`MutationObserver`), e.g. rrweb approach; masks PII inputs.
- Sends batches with `navigator.sendBeacon` / `fetch(..., { keepalive: true })` on `visibilitychange` → hidden. Sampling to control volume.
- **Source maps** uploaded at build time so minified stack traces become readable.
- Must not hurt the host app: tiny bundle, idle-time work, no throwing.

## 6. JD → what they're testing → what you say

| JD line | What they probe | Your angle (prepare a story) |
| --- | --- | --- |
| Own complex features idea → production | Did you drive, not just implement? | A feature where you shaped requirements, made architecture calls, shipped, measured |
| High-performance UX in Angular | Angular depth, perf | If Angular experience is light: "Strong React, Angular concepts map 1:1, I've been building X in Angular" + show modern Angular knowledge (signals, OnPush, zoneless) |
| Drive frontend architecture | Trade-offs, scalability | Module boundaries, state strategy, design system, monorepo |
| Translate large data into simple UX | Product sense + perf | Tables/charts/dashboards you built; how you reduced cognitive load |
| Proactively improve product & practices | Initiative | Something you started without being asked (tooling, perf budget, testing strategy) |
| Review code, mentor | Leadership | How you review (what you look for), someone you helped grow |
| AI-assisted development | Modern workflow + judgment | Concrete workflow: what you delegate to AI, how you verify, where it fails |
| Hungry, humble, smart | Culture | Learning stories, admitting mistakes, curiosity |

## 7. Product-thinking prep (do this on Day 1)

Open the Coralogix demo / trial / public videos and write:

1. Three things in Explore/APM/RUM that are great UX.
2. Three things you would improve (be constructive — "I'd test whether…").
3. One feature idea for each product (e.g. "save-as-alert from a selected histogram spike", "diff two time ranges", "AI summary of an error group").

Use 1–2 of these in the interview when asked "Any questions?" or "What would you improve?" It's the strongest signal for "builder at heart".

## 8. Competitors (for "why Coralogix")

Datadog, Splunk, New Relic, Grafana (Loki/Tempo/Mimir), Elastic, Dynatrace, Honeycomb, Sentry (RUM/errors). Coralogix positions on **cost + in-stream analytics + customer-owned storage**.

**Why Coralogix (draft, personalize it):**
"I want to build tools for engineers — I am the user, so I can judge the UX myself. Observability UIs are some of the hardest frontend problems: huge data, real-time updates, complex interactions, and performance matters. And the team owns features end to end, which is how I like to work."
