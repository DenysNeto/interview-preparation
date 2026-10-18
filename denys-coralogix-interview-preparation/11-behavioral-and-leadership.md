# Behavioral, Leadership, and Product Thinking

The JD is unusually explicit about **ownership, product thinking, ambiguity, mentoring, and AI usage**. The culture line is "hungry, humble, smart". Every story should show at least one of those.

---

## 1. STAR template (≤ 2 min spoken)

| Part | Length | Content |
| --- | --- | --- |
| **S**ituation | 1–2 sentences | Company/product, scale, why it mattered |
| **T**ask | 1 sentence | *Your* responsibility, the hard part |
| **A**ction | 60% of time | What **you** did ("I", not "we"): decisions, trade-offs, how you aligned people |
| **R**esult | 1–2 sentences | Numbers (latency, adoption, bugs, time saved), what you learned |

Add a 1-sentence **reflection** at the end ("Next time I'd involve design earlier"). That's the "humble" signal.

## 2. Story bank — fill these in

Write each story in bullet form below (not full prose), then practise speaking.

| # | Theme (JD line) | Your story (title) | Key numbers |
| --- | --- | --- | --- |
| 1 | End-to-end ownership: idea → production | | |
| 2 | Ambiguity: vague requirements, you defined the solution | | |
| 3 | Disagreed with Product/Design and changed (or didn't change) the outcome | | |
| 4 | Performance win on a data-heavy UI | | |
| 5 | Architecture decision with trade-offs (RFC/ADR, migration) | | |
| 6 | Mentoring / raising the bar (code review culture, onboarding, tooling) | | |
| 7 | Mistake / production incident you caused or owned | | |
| 8 | Cross-team work with Backend (API design, contract change) | | |
| 9 | Proactively improved something nobody asked for | | |
| 10 | AI-assisted development: concrete workflow and a case where AI was wrong | | |

**Story template**

```
Title:
S:
T:
A: (3–5 bullets with decisions + why)
R: (numbers)
Reflection:
Which questions this answers:
```

## 3. Question bank

**Ownership & product**

- Tell me about a feature you owned end to end. How did you decide what to build?
- Tell me about a time you challenged a requirement or a design.
- How do you balance shipping fast vs quality?
- How do you decide what *not* to build?
- What's a product you think has great UX for complex data? Why?
- What would you improve in Coralogix? (Use your Day-1 notes.)

**Technical leadership**

- Describe the most complex frontend architecture you designed. What would you change now?
- How do you introduce a new pattern/library to a team?
- How do you handle tech debt vs feature work?
- Tell me about a time you had to make a decision with incomplete information.

**Collaboration & conflict**

- Disagreement with a backend engineer about an API — how did you resolve it?
- A designer gives you a design that will be slow with real data. What do you do?
- A teammate keeps submitting low-quality PRs. How do you handle it?

**Mentoring**

- How do you review code? What do you look for first? (See [05-architecture-nx-monorepo.md](05-architecture-nx-monorepo.md) section 7.)
- Tell me about someone you helped grow.

**Failure & learning (hungry, humble)**

- Tell me about a production bug you caused.
- What's something technical you learned recently and how?
- What feedback have you received that changed how you work?

**Motivation**

- Why are you leaving your current role?
- Why Coralogix? Why observability?
- What are you looking for in your next team?
- Where do you want to grow in the next 2 years?

## 4. AI-assisted development (prepare a crisp, honest answer)

The JD mentions it twice. They want **effective use + judgment**, not hype and not refusal.

Answer skeleton:

> "I use AI daily — mostly [Cursor / Copilot / Claude]. Where it helps most: scaffolding components and tests, exploring an unfamiliar codebase, writing migrations and codemods, drafting RFCs, and as a rubber duck for debugging. My rules: I own every line that gets merged; I keep changes small so I can review them properly; I give the model context (existing patterns, types, rules files) so output matches our conventions; and I verify with tests and by running the code. Where I don't trust it: subtle concurrency/RxJS behaviour, performance-critical code, security-sensitive code, and newer framework APIs it may hallucinate — Angular changed a lot recently, so I check the docs. Example: [specific case where AI saved time] and [case where it produced a wrong RxJS operator / outdated Angular API and how you caught it]."

Bonus senior points: team-level practices — shared rules/prompt files for conventions, AI-assisted code review as a first pass (not a replacement), measuring whether it actually speeds delivery.

## 5. "Tell me about yourself" (90 seconds)

Structure:

1. **Now**: "I'm a frontend engineer with N years, currently at X, where I own Y." (Key: complex, data-heavy, production.)
2. **Highlights** (2 achievements with numbers aligned to the JD: ownership, performance/data, leadership).
3. **How I work**: product-minded, end-to-end, mentoring.
4. **Why here**: observability tools for engineers, hard frontend problems, product ownership.

Address Angular up front if your recent experience is mostly React: "My last years were mostly React + TypeScript; I've worked with Angular [when/how much], and I've been deep in modern Angular — signals, standalone, zoneless. The core problems — state, performance, architecture for large apps — are the same, and I ramp up fast on frameworks." Then prove it in the technical rounds.

## 6. Questions to ask them (pick 3–5 per interviewer)

**Team & product (to engineers / team lead)**

- What does the ownership split look like between your squad and backend teams for Explore/APM/RUM?
- What's the hardest frontend performance problem you're dealing with right now?
- How far is the migration to signals / zoneless / standalone? Is there NgRx?
- How is the monorepo organized, and how long does CI take on a typical PR?
- How do you decide what to build — who brings ideas, and how often do engineers drive product decisions?
- Do you use Coralogix RUM to monitor Coralogix itself? (Dogfooding.)

**Ways of working**

- How does a feature go from idea to production here? What does a typical week look like?
- How do you use AI tools in the team today? Any guidelines?
- How do you measure success for a frontend feature?

**Growth (to manager)**

- What would make someone exceptional in this role in the first 6 months?
- What are the biggest challenges for the squad this year?
- How does growth beyond senior look here (staff/lead track)?

## 7. Red flags to avoid

- "We did…" without your part. Say "I".
- Blaming other teams/people in conflict stories.
- No numbers in results.
- Pretending to know Angular deeply if you don't — be honest + show fast learning.
- Being negative about your current employer.
- Long monologues — stop at 2 minutes, offer to go deeper.
