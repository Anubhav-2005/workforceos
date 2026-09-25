# WorkforceOS final presentation notes

## The one sentence to remember

**WorkforceOS is an operating system where specialized AI employees collaborate on business work while people retain control at the decisions that matter.**

## Final-round format

The official Round 3 email allocates a 10-12 minute team slot for the presentation, prototype, and live walkthrough. The latest jury brief narrows the working format to:

- 2-3 minutes: problem and solution;
- 3-4 minutes: complete working MVP;
- final portion: jury questions.

Rehearse **6:30 of prepared content plus a 30-second buffer**, followed by Q&A. Assign one presenter and one teammate to watch the clock and handle recovery.

## Stopwatch checkpoints

| Clock | You should be here                        |
| ----- | ----------------------------------------- |
| 0:55  | Finish the problem                        |
| 1:35  | Finish the product explanation            |
| 2:30  | Begin the live dashboard                  |
| 4:10  | Resume result is visible                  |
| 4:50  | Human decision is complete                |
| 5:55  | Workflow run is complete                  |
| 6:30  | Analytics is complete; begin final close  |
| 7:00  | Stop speaking and take the first question |

## Story in four beats

1. **Fragmentation:** companies have capable AI tools but still move context and approvals manually.
2. **Coordination:** WorkforceOS gives role-based AI employees shared work, visible handoffs, and performance context.
3. **Control:** AI prepares and routes work; humans own consequential decisions.
4. **Outcome:** leaders can see throughput, failures, approvals, and time reclaimed across the workforce.

## What the MVP proves

- Maya, the AI Recruiter, accepts a PDF and returns a validated, structured hiring analysis through a real server-side OpenAI path.
- Candidate decisions remain behind an explicit human approval step.
- The Workforce Engine visualizes Recruiter, Approval, Sales, and Support handoffs with runtime states and a live log.
- The public demo saves fictional state in this browser; connected mode saves accounts, candidates, tasks, approvals, and workflow runs in PostgreSQL.
- Analytics and CSV export turn activity into a management view.
- Navigation, menus, modals, buttons, empty states, error states, loading feedback, and responsive layouts are functional.

## Scoring strategy

### Live prototype performance - 30%

Show one uninterrupted loop: **resume review → structured analysis → human decision → workflow execution → outcome analytics**. Upload a real PDF only on a connected deployment you have already tested. Otherwise use the labeled fictional result and explicitly call the workflow a local simulation. If an external service fails, acknowledge it once and continue with a prepared candidate or the demo path.

### Business model and real-world scalability - 25%

Use this answer:

“We enter through high-volume recruiting for startups, staffing agencies, and lean HR teams. The commercial model combines a workspace subscription, role-based AI employee packs, and metered execution. Expansion comes from adding Sales, Support, Finance, and Operations on the same orchestration layer. Enterprise tiers add integrations, governance, audit controls, and service guarantees.”

Why the model can work:

- the recruiting wedge has frequent, measurable work and clear human decision points;
- model and infrastructure cost scale with usage and can be priced into execution;
- shared workflow infrastructure supports multiple employee roles without rebuilding the platform;
- customer value can be measured through review time, cycle time, throughput, and conversion—not vague “AI adoption.”

### Defence of technical architecture - 25%

Use this 20-second architecture explanation:

“The interface uses Next.js App Router, React, and strict TypeScript. Connected API routes require a workspace session and save records in PostgreSQL. A server-only Node route validates and parses the PDF, calls the OpenAI Responses API with a strict schema, and validates the output again. The workflow runner persists steps and human approvals; a browser-local simulation remains for public demos. Secrets never enter client code.”

Be ready to explain these deliberate MVP boundaries:

- `localStorage` is limited to the labeled demo path; connected mode has sessions and tenant-scoped Postgres records;
- connected workflow steps and approvals persist, but external email and ATS actions remain drafts/unconnected;
- request limiting is per server instance and must become distributed at scale;
- raw resumes are not persisted by the MVP;
- human approval is required because model scores are decision support, not ground truth.

### Pitch delivery and time management - 20%

- Lead with the business pain, not the tech stack.
- Use one sentence per click and keep the cursor still while speaking.
- Do not read every field or metric; explain why the screen matters.
- Say “AI employees” consistently. Avoid switching between agents, bots, and assistants.
- Be transparent about what is real, local, and simulated.
- Stop at seven minutes even if a secondary screen was skipped.

## Business model in one slide or answer

### Initial customer

Startups, staffing firms, and lean people teams that process enough candidates to feel the coordination cost but cannot build an internal AI platform.

### Revenue layers

1. Base workspace subscription for visibility, approvals, analytics, and administration.
2. AI employee packs for Recruiter, Sales, Support, and future roles.
3. Metered execution for document analysis and automated workflow runs.
4. Enterprise tier for SSO, integrations, audit retention, private networking, governance, and support.

### Go-to-market

Land with Recruiter because the before-and-after outcome is measurable. Prove reduced screening and handoff time, then expand into onboarding, sales follow-up, and support. Partner integrations with ATS, CRM, email, calendar, and helpdesk products reduce adoption friction.

### Metrics that matter

- time from resume receipt to human decision;
- candidates processed per reviewer;
- approval turnaround time;
- workflow completion and failure rate;
- model cost per completed business outcome;
- human override rate and quality after hire.

## Production scalability path

| MVP today                               | Production evolution                                           |
| --------------------------------------- | -------------------------------------------------------------- |
| Local demo plus tenant-scoped Postgres  | Production database operations and retention policies          |
| Opaque sessions and workspace roles     | SSO, account recovery, and enterprise access reviews           |
| Request-driven persisted workflow steps | Durable queue/runner with retries and idempotency              |
| In-memory request limiting              | Distributed rate limiting and per-tenant quotas                |
| No original-resume persistence          | Encrypted object storage only if a retention use case needs it |
| Audit records and basic errors          | Central tracing, alerts, and model evaluations                 |
| One OpenAI-backed skill                 | Model routing, fallbacks, budgets, and versioned prompts       |
| Internal draft actions                  | ATS, CRM, email, calendar, and helpdesk integrations           |

## Claims boundary

Say these precisely:

- **Real in connected mode:** responsive product UI, account sessions, tenant-scoped records, PDF validation and extraction, server-side OpenAI analysis, human decisions, persisted workflow steps and logs, measured analytics, and CSV export.
- **Demo-only:** fictional browser-local candidates and timer-based handoffs, clearly labeled by the amber banner.
- **Not connected:** external ATS updates, sent email, welcome-package delivery, and durable background execution across systems.
- **Planned:** production deployment of connected mode, enterprise integrations, queue workers, deeper governance, and model evaluations.

Never describe seeded metrics as customer results. Call them representative product data.

## Delivery cues

- Begin slowly; the first 20 seconds set confidence.
- Pause after “a collection of assistants, not a workforce.”
- During model loading, explain the server architecture instead of waiting silently.
- At the approval gate, say “AI recommends; a human decides.”
- At workflow completion, pause and let the live log make the point.
- Finish with the memorized final line and stop.

## Final line

**“WorkforceOS turns AI tools into an accountable workforce—specialized, coordinated, measurable, and always under human control.”**
