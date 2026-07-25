# Presentation notes

## One-line pitch

WorkforceOS is an operating system where specialized AI employees collaborate on business work while people retain control at the decisions that matter.

## Problem

AI adoption has produced many useful point tools, but not a coherent way to coordinate them. Teams still manually transfer context, check progress, and chase approvals across recruiting, sales, support, and operations.

## Product thesis

The next interface for AI at work is not a chat window per tool. It is a visible workforce: role-based employees, shared work queues, explicit handoffs, and human approval gates.

## Demo narrative

Start with a resume. The Recruiter extracts structured evidence and a recommendation. A human reviews the decision. Once approved, the Workforce Engine coordinates Sales and Customer Support to prepare onboarding. Analytics makes the business outcome visible.

## What was built

- A responsive AI workforce dashboard with shared task, notification, and profile interactions.
- A production-shaped Recruiter pipeline: PDF validation, server-side extraction, OpenAI Responses API, strict JSON Schema, and friendly recovery states.
- A visual Workforce Engine with animated execution, approval pauses, logs, workflow controls, and local persistence.
- Role-focused Sales and Support employee views plus analytics and settings.

## Technical credibility

- Next.js App Router, React, TypeScript, Tailwind CSS, and Framer Motion.
- One server-only OpenAI SDK client; browser code never receives the API key.
- Bounded PDF input, rate limiting, request timeout, strict structured output, and application-side validation.
- Local-first persistence keeps the two-day MVP simple while the service boundaries support a database and durable runner later.

## Differentiation

Most automation tools expose generic boxes and triggers. WorkforceOS starts from organizational roles and makes collaboration legible: which employee is working, why a workflow is paused, where a human decision is required, and what business result was produced.

## Closing

“WorkforceOS is not trying to replace people with a single assistant. It gives teams a way to operate a growing AI workforce with visibility, accountability, and human judgment built in.”
