# WorkforceOS

WorkforceOS is an AI workforce operating system that brings recruiting, sales, support, human approvals, and cross-agent workflows into one focused workspace.

![WorkforceOS preview](./public/og.png)

Built by [Anubhav Pandey](https://github.com/Anubhav-2005) as a functional AI hackathon MVP.

## Product overview

The current MVP demonstrates how teams can manage individual AI employees and coordinate work between them:

- A functional App Router dashboard with responsive navigation and locally persisted tasks.
- An AI Recruiter that accepts PDF resumes and returns structured hiring analysis.
- Candidate review, approval, interview-request, and rejection workflows.
- A visual Workforce Engine with animated handoffs and human approval checkpoints.
- Local analytics, downloadable reports, notifications, settings, loading states, and error recovery.

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- OpenAI Node SDK and Responses API
- `pdf-parse` for server-side resume extraction

## Getting started

### Prerequisites

- Node.js 20.9 or newer
- npm
- An OpenAI API key for resume analysis

### Installation

```bash
git clone https://github.com/Anubhav-2005/workforceos.git
cd workforceos
npm install
cp .env.example .env.local
```

Add your OpenAI API key to `.env.local`:

```bash
OPENAI_API_KEY=your_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available scripts

| Command                | Purpose                                |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | Start the local development server     |
| `npm run build`        | Create a production build              |
| `npm run start`        | Start the production server            |
| `npm run lint`         | Run ESLint                             |
| `npm run typecheck`    | Run TypeScript without emitting files  |
| `npm run format`       | Format supported files                 |
| `npm run format:check` | Verify formatting                      |
| `npm run check`        | Run lint, types, and formatting checks |

## Architecture

```text
src/
├── app/
│   ├── api/recruiter/analyze/   # Secure PDF analysis route
│   └── dashboard/               # App Router pages and boundaries
├── components/
│   ├── dashboard/               # Shared shell and dashboard surfaces
│   ├── recruiter/               # AI Recruiter workspace
│   └── workflow/                # Workforce Engine visualization
├── constants/                   # Stable navigation configuration
├── lib/                         # Environment, OpenAI, data, and utilities
├── services/                    # Client service and workflow engine layers
└── types/                       # Domain models and runtime validation
```

Server-only OpenAI configuration stays in `src/lib/openai.ts`. Browser components submit PDFs to the recruiter route through `src/services/recruiter.ts`; no API key is included in the client bundle.

Application records intentionally use `localStorage` for this MVP. The persistence layer is isolated so a database can replace it without changing the UI architecture.

## Environment variables

| Variable              | Required            | Description                                                   |
| --------------------- | ------------------- | ------------------------------------------------------------- |
| `OPENAI_API_KEY`      | For resume analysis | Server-side OpenAI API credential                             |
| `NEXT_PUBLIC_APP_URL` | Production          | Absolute deployed URL used by metadata and sitemap generation |

Never commit `.env.local` or production credentials.

## Recruiter API safeguards

- PDF extension, MIME type, file signature, size, and extracted-text validation
- Server-only secrets and no-store API responses
- Bounded resume input and conservative extraction prompt
- Strict JSON Schema output with application-side validation
- Refusal, malformed response, timeout, network, and rate-limit handling
- Lightweight per-instance request limiting suitable for the MVP

For a multi-instance production rollout, replace the in-memory limiter with a shared provider such as Vercel KV, Upstash Redis, or an API gateway.

## Deployment

### Vercel

1. Import the repository into Vercel.
2. Add `OPENAI_API_KEY` and `NEXT_PUBLIC_APP_URL` in Project Settings → Environment Variables.
3. Use the default Next.js build command: `npm run build`.
4. Deploy and verify `/dashboard/employees/recruiter` and `/dashboard/workflows`.

The OpenAI route uses the Node.js runtime and declares a 60-second maximum duration.

## Roadmap

- Authentication and workspace membership
- Durable database-backed task and candidate state
- Shared distributed rate limiting
- Real workflow definitions and background execution
- Audit trails and role-based approval policies
- Sales and Support domain integrations
- Observability, product analytics, and automated tests

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the development workflow and quality requirements.

## License

This project is available under the [MIT License](./LICENSE).
