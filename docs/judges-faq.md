# Judges FAQ

## What problem are you solving?

Teams have useful AI tools but no shared operating layer for coordinating them. Work is fragmented, handoffs are manual, approvals happen outside the process, and leaders cannot clearly see outcomes. WorkforceOS organizes role-based AI employees around visible tasks, workflows, and human decision points.

## Why is this different from a chatbot or generic workflow tool?

WorkforceOS makes business roles the primary interface. A Recruiter, Sales Executive, and Customer Support employee have dedicated workspaces, performance context, and clear handoffs. The Workforce Engine makes the collaboration and human approval state visible rather than hiding it behind a generic automation canvas.

## How does OpenAI work in the product?

When a user uploads a resume, the browser sends it to an internal Next.js route. The server validates the PDF, extracts its text, and sends bounded text to the OpenAI Responses API using a strict JSON Schema. The UI receives a structured hiring analysis—rather than free-form markdown—and validates it before displaying it.

## Is the OpenAI API key exposed to users?

No. The key is read only by the server from `OPENAI_API_KEY`. The browser calls an internal API route and never imports the OpenAI client or sees the credential. Environment files are ignored by Git, and the repository contains only an empty `.env.example` template.

## How is uploaded data secured?

The current MVP does not persist original PDFs. Uploads are limited to 5 MB and checked by type, filename, signature, and extracted-text length. Resume text is bounded before analysis. Responses use strict output validation and are requested with OpenAI response storage disabled. Production work would add authenticated workspaces, encrypted object storage only when needed, retention controls, and audit logs.

## Can this scale beyond a demo?

Yes. The project separates the UI, client service, API route, prompts, validation, and OpenAI client. That lets the local storage layer be replaced with a database, the in-memory limiter with a distributed store, and the visual simulator with a durable workflow runner without rewriting feature UI.

## What is the business model?

The natural model is a workspace subscription with seats for human operators and usage-based AI execution. Higher tiers can include premium workflow templates, integration packs, audit controls, governance, and managed model routing.

## What is next on the roadmap?

The next milestones are authentication and durable data; real workflow execution with retries; ATS, CRM, email, calendar, and helpdesk integrations; and quality, cost, and governance controls. See [future-roadmap.md](./future-roadmap.md) for the phased plan.

## What is intentionally simulated today?

Cross-employee handoffs and onboarding actions are simulated to demonstrate the product interaction within the hackathon time limit. The Recruiter’s PDF validation, server extraction, internal API boundary, and OpenAI structured-analysis pathway are implemented as real application infrastructure.
