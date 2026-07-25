# Demo script

## Goal

Show the full WorkforceOS loop in under three minutes: an AI employee completes work, a person stays in control, and work moves visibly across the workforce.

## Setup before recording

- Open the deployed site in a clean browser session.
- Confirm the production `OPENAI_API_KEY` has available API credits.
- Keep a text-based PDF resume under 5 MB ready to upload.
- Start on the dashboard at a desktop width; briefly switch to a phone width near the end.

## 0:00–0:20 — The problem and workspace

“AI tools are usually isolated. WorkforceOS gives a team one operating layer for specialized AI employees, approvals, and cross-functional handoffs.”

Point out the employee roster, the shared task view, and the activity overview.

## 0:20–1:15 — AI Recruiter

1. Open **Maya, AI Recruiter**.
2. Mention the live workload, accuracy, and task queue.
3. Select **Resume Review** and drag in the sample PDF.
4. Point out the upload state and explain that the PDF is validated and parsed on the server.
5. When the analysis returns, highlight the candidate name, experience, skills, score, decision, strengths, weaknesses, and recommended role.
6. Open the candidate drawer to show the human-readable detail view.

Suggested line: “The model returns strict structured data, so the analysis is usable inside a workflow instead of being a blob of chat text.”

## 1:15–1:50 — Human control

1. Open **Approvals**.
2. Choose **Request interview** or **Approve** for a pending candidate.
3. Show the immediate state update and toast confirmation.

Suggested line: “The AI prepares the decision, but WorkforceOS keeps the decision point with a person.”

## 1:50–2:40 — Workforce Engine

1. Open **Workflows**.
2. Select the resume-to-onboarding workflow.
3. Press **Run Workflow**.
4. Narrate the animated handoff from Recruiter to Human Approval, Sales, and Customer Support.
5. At the approval pause, choose **Approve** to resume.
6. Point to the live execution log and completed nodes.

Suggested line: “This is the difference between several AI features and an AI workforce: each handoff is observable, intentional, and interruptible.”

## 2:40–3:00 — Outcomes and close

1. Open **Analytics** and point to throughput, time reclaimed, and success-rate trends.
2. Briefly show the responsive navigation on a narrow viewport.

Close with: “WorkforceOS turns specialized AI employees into a coordinated, accountable operating model. The MVP is local-first today, with clear seams for durable workflows, integrations, and multi-tenant collaboration.”

## Fallback if the AI project has no API credits

Use the seeded candidate pipeline and the Workflow Engine simulation. Be direct: “The UI, validation, structured-output route, and error states are live; this environment needs API credits to perform a new model analysis.” Do not claim a model call succeeded if it did not.
