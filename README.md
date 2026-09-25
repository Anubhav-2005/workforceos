# WorkforceOS

[![Quality](https://github.com/Anubhav-2005/workforceos/actions/workflows/quality.yml/badge.svg)](https://github.com/Anubhav-2005/workforceos/actions/workflows/quality.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)
![License](https://img.shields.io/badge/license-MIT-22c55e)

WorkforceOS is an operating system for teams of AI employees. It gives people one place to assign work, review decisions, coordinate handoffs, and understand what their AI workforce accomplished.

This repository is a functional hackathon MVP built by [Anubhav Pandey](https://github.com/Anubhav-2005).

## Why I built this

I kept noticing the same gap in AI demos: each tool looked capable on its own, but a person still had to copy the result into the next tool, remember who was waiting, and make important decisions outside the workflow. I wanted to explore what the product looks like when the main object is not a chat, but a team.

Recruiting became the test case because it forces the hard parts into the open. The input is messy, the output needs structure, the decision affects a person, and the work does not end after the resume is reviewed. That made it a useful way to test coordination without pretending that AI should make the final call.

![WorkforceOS product preview](./public/og.png)

## If you are judging this project

The fastest review path takes about three minutes:

1. Open the [live dashboard](https://workforceos-bay.vercel.app/dashboard). If the amber **Demo workspace** banner appears, the deployment is running the browser-local demonstration. Explore **AI Employees → Recruiter → Resume Review**, use the clearly labeled fictional result, and run the local workflow simulation.
2. On a deployment with `DATABASE_URL` and `OPENAI_API_KEY`, create an account, upload a text-based PDF under 4 MB, and review the structured analysis in **Recruiter**.
3. Approve the candidate in **Approvals**, then run **Candidate onboarding** in **Workflows**. The persisted run pauses at a human gate and resumes only after a reviewer approves it.
4. Open **Tasks** to run a separate AI assignment, and **Analytics** to see measured outcomes.

What is real today: the product UI; PDF validation and text extraction; server-side OpenAI Responses API analysis with strict schema validation; account sessions and tenant-scoped Postgres records when configured; human approval gates; persisted workflow steps, logs, and drafts; and CSV export. The browser-local demo is explicitly labeled. External ATS, email, and onboarding actions are **not connected**; AI output is a draft, not a sent message or hiring decision.

For a deeper review, see the [architecture](./docs/architecture.md), [feature inventory](./docs/features.md), [jury Q&A](./docs/judges-faq.md), and [demo script](./docs/demo-script.md).

## The problem

Most AI tools work alone. A recruiter can review a resume, a sales assistant can draft an email, and a support assistant can prepare an answer—but the work still has to be moved between tools by a person.

That creates three practical problems:

- teams cannot see what their AI tools are doing in one place;
- handoffs between tools are manual and easy to lose;
- important decisions lack a clear human approval point.

## Our solution

WorkforceOS treats AI tools as members of a coordinated workforce. Each AI employee has a role, task queue, status, and performance view. The Workforce Engine connects those employees into a visible workflow and pauses when a human decision is required.

The app has two modes. Without `DATABASE_URL`, the original browser-local demo is available for quick review and is visibly labeled. With Postgres configured, accounts, tasks, candidates, approvals, workflow runs, activity, and analytics are persisted per workspace. OpenAI is called only from authenticated server routes; the API key never reaches the browser.

## Core features

### AI Recruiter

- Upload a PDF resume by browsing or drag and drop.
- Validate the file type, signature, size, and extracted text.
- Generate a strict, structured hiring analysis with OpenAI.
- Review skills, strengths, weaknesses, experience, score, decision, and recommended role.
- Move candidates through approval, rejection, and interview-request states.
- Browse paginated candidates and approval queues with workspace-wide pipeline metrics.
- Persist candidates and decisions in the signed-in workspace; browser-local demo data remains separate.

### AI Sales Executive

- View assigned outreach work and progress.
- Pause or resume the employee.
- Assign new work from the shared task modal.
- Review activity, performance, and approval state.

### AI Customer Support

- Monitor support work and completion progress.
- Assign new work and review recent activity.
- Keep human review available for sensitive responses.

### Workforce Engine

- Create, rename, duplicate, enable, disable, and archive workflows.
- Edit linear workflow steps, assignments, and instructions; existing runs keep their saved execution snapshot.
- Run an animated collaboration from resume upload to onboarding.
- Pause execution for a human approval.
- Approve and resume, or reject and stop the workflow.
- Follow a live execution log and workflow analytics.
- Persist workflow definitions, steps, human approvals, and run history in Postgres when connected.

### Analytics dashboard

- Review measured task completions, workflow success, human approvals, AI executions, and token usage in connected mode.
- Switch between weekly, monthly, and quarterly views.
- Inspect daily efficiency.
- Export the current report as CSV.

## Live demo

[Open the live WorkforceOS dashboard](https://workforceos-bay.vercel.app/dashboard).

The connected-workspace implementation is on the `codex/connected-mvp` branch and has not been deployed with a database by this work. Check the live site's banner before presenting: if it says **Demo workspace**, fictional candidate data and workflow simulation work locally in the browser, but live AI analysis and shared accounts are disabled. Connected mode requires Postgres, a funded server-side `OPENAI_API_KEY`, and migrations.

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- OpenAI Node SDK and Responses API
- `pdf-parse` for server-side PDF text extraction
- Prisma and PostgreSQL for connected workspaces
- `bcryptjs` for password hashes and opaque, HTTP-only database sessions

## Architecture

```text
Browser
  ├─ Labeled local demo (only when DATABASE_URL is absent)
  └─ Authenticated workspace UI
         │
         ▼
Next.js App Router + tenant-scoped route handlers
  ├─ PostgreSQL / Prisma: people, tasks, candidates, approvals, runs, activity
  ├─ Recruiter: bounded PDF parsing → OpenAI Responses API → strict schema
  └─ Workforce Engine: persisted node steps → human gate → reviewed drafts
```

The OpenAI client lives in one server-only module: `src/lib/openai.ts`. Client components never import it. They call `src/services/recruiter.ts`, which sends the PDF to `src/app/api/recruiter/analyze/route.ts`.

The connected path uses database-backed records; `localStorage` remains only for the standalone demo path. Raw uploaded PDFs are not retained by the server after text extraction; metadata and structured analysis are stored.

More detail is available in [docs/architecture.md](./docs/architecture.md).

## Installation

### Prerequisites

- Node.js 20.9 or newer
- npm
- PostgreSQL 15+ for connected mode
- An OpenAI API project with available credits for live AI analysis

Clone and install:

```bash
git clone https://github.com/Anubhav-2005/workforceos.git
cd workforceos
npm install
cp .env.example .env.local
```

## Environment variables

Add the following values to `.env.local`:

```env
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://user:password@localhost:5432/workforceos
OPENAI_MODEL=gpt-5.6-terra
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

| Variable              | Required           | Purpose                                                                            |
| --------------------- | ------------------ | ---------------------------------------------------------------------------------- |
| `DATABASE_URL`        | For connected mode | PostgreSQL connection string. Without it, the app runs in labeled local demo mode. |
| `OPENAI_API_KEY`      | For live AI work   | Server-side OpenAI credential. Never expose or commit it.                          |
| `OPENAI_MODEL`        | Optional           | Responses API model for AI tasks (default: `gpt-5.6-terra`).                       |
| `NEXT_PUBLIC_APP_URL` | Recommended        | Absolute URL for canonical metadata, sitemap, and social cards.                    |

Never add `.env.local` or a real credential to Git. A key pasted into a chat or issue should be rotated before deployment.

## Running locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For connected mode, first create a PostgreSQL database and set `DATABASE_URL`, then run:

```bash
npm run db:deploy
npm run dev
```

Create an account at `/sign-up`. Initial AI employees and a candidate-onboarding workflow are created for that workspace. Without `DATABASE_URL`, no migration or account is needed for the labeled demo.

Useful checks:

```bash
npm run lint
npm run typecheck
npm run format:check
npm run build
npm test
npm audit --audit-level=high
```

## Deployment

### Vercel

1. Import `Anubhav-2005/workforceos` into Vercel.
2. Provision PostgreSQL, run `npm run db:deploy` against it, and set `DATABASE_URL` in Vercel.
3. Add a funded `OPENAI_API_KEY` as a secret and set `NEXT_PUBLIC_APP_URL` to the final URL.
4. Deploy with `npm run build`; it generates the Prisma client before compiling.
5. Sign up, upload a PDF, check the approval pause/resume, run a task, and verify persistence after refresh.

No `vercel.json` is required for the current architecture. The Recruiter API route explicitly uses the Node.js runtime and allows up to 60 seconds for PDF extraction and analysis.

See [docs/deployment.md](./docs/deployment.md) for the complete deployment and verification procedure.

## Folder structure

```text
.
├── docs/                         # Hackathon, architecture, demo, and launch material
├── public/                       # Product metadata assets
├── src/
│   ├── app/
│   │   ├── api/recruiter/        # Secure resume analysis route
│   │   └── dashboard/            # App Router pages and route boundaries
│   ├── components/
│   │   ├── dashboard/            # Shared shell and dashboard pages
│   │   ├── recruiter/            # Recruiter workspace and analysis UI
│   │   └── workflow/             # Workforce Engine and simulation
│   ├── constants/                # Navigation configuration
│   ├── lib/                      # Environment, OpenAI, prompts, and domain data
│   ├── services/                 # Client API and workflow services
│   └── types/                    # Domain types and runtime validation
└── PROJECT_RELEASE_CHECKLIST.md
```

## Security notes

- Secrets are read only from server-side environment variables.
- Uploaded PDFs are limited to 4 MB (including multipart overhead below Vercel's body limit) and checked by MIME type, extension, and file signature.
- Extracted resume text is bounded before it is sent to OpenAI.
- OpenAI responses use strict JSON Schema and are validated again by the application.
- OpenAI response storage is disabled for this request.
- API responses are not cached.
- The MVP includes per-instance request limiting.
- Connected routes require a workspace session; mutating routes enforce role checks and same-origin requests.
- Raw PDFs are discarded after extraction; candidate analysis and audit records live in the workspace database.

For a multi-instance production rollout, replace the in-memory limiter with a shared rate-limit store such as Vercel KV or Upstash Redis.

## Future scope

- Shared/distributed request limiting and background job queues
- Crash recovery, idempotent retries, and operational monitoring for workflow runs
- CRM, helpdesk, calendar, email, and HRIS integrations
- Expanded audit trails, observability, and evaluation dashboards
- Additional specialized AI employees

The planned sequence is documented in [docs/future-roadmap.md](./docs/future-roadmap.md).

## Decisions and tradeoffs

This was built as a hackathon MVP, so I made a few deliberate cuts:

- I chose one real end-to-end AI path—the Recruiter—instead of adding several shallow model demos.
- I kept a clearly labeled browser-local demo while adding a separate PostgreSQL-backed path for shared workspaces. A database must be provisioned and migrated before that path can be used.
- I built the Workforce Engine as a typed graph with persisted step execution and human gates. It does not claim to send email or update external systems; background workers, idempotent retries, and connectors are future work.
- I validate model output twice: first with strict JSON Schema at the API and again with application-side runtime guards. Model output is external input, even when it came from a structured request.
- I made the human approval step part of the execution path. The hiring score is decision support, not an autonomous hiring decision.

The next engineering investment is an independent job worker, shared rate limiting, evaluation data, and connector permissions. Those matter more than another dashboard card.

## Contributors

- [Anubhav Pandey](https://github.com/Anubhav-2005) — product, design, and engineering

Contributions are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

## License

WorkforceOS is released under the [MIT License](./LICENSE).
