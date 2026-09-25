# WorkforceOS final demo script

## Run of show

Target **6:30 of prepared content**, leaving 30 seconds of safety inside the seven-minute limit.

| Time      | Section                | Jury signal                                      |
| --------- | ---------------------- | ------------------------------------------------ |
| 0:00-2:30 | Problem and solution   | Relevance, differentiation, business viability   |
| 2:30-6:30 | Complete working MVP   | Live performance, human control, technical depth |
| 6:30-7:00 | Outcome and final line | Scalability, clarity, memorable close            |
| Afterward | Jury questions         | Architecture, trade-offs, real-world execution   |

## Before joining the meeting

- Choose the demo path before presenting. If the amber **Demo workspace** banner appears, use the labeled fictional analysis and local workflow simulation. Do not call that a live AI or shared-workspace run.
- Use a connected deployment for the live-AI path only after Postgres migrations, a funded rotated `OPENAI_API_KEY`, and one successful end-to-end test in the same browser and network.
- For the connected path, keep one clean, text-based fictional PDF resume under 4 MB on the desktop.
- Open the dashboard in the first tab and keep the Recruiter and Workflow Engine one click away.
- Keep the browser at a readable desktop zoom, silence notifications, close unrelated tabs, and share only the browser window.
- Rehearse the exact clicks twice with a stopwatch. Do not add features or explanations during the live run.
- Keep a local build and a short backup recording available, but use them only if the production deployment fails.

## 0:00-2:30 - Problem and solution

### 0:00-0:20 - Hook

**Say:**

“Businesses do not have an AI-tool problem anymore. They have an AI-coordination problem. A recruiter can screen a resume, another tool can draft an email, and another can prepare onboarding—but a person still has to move every piece of context between them.”

### 0:20-0:55 - The pain

**Say:**

“That creates three failures: work disappears between tools, leaders cannot see what AI is doing, and important decisions happen without a clear approval trail. The result is a collection of assistants, not a workforce.”

“For a hiring team, that means repeatedly reading resumes, copying candidate details, chasing approvals, writing follow-ups, and preparing onboarding by hand.”

### 0:55-1:35 - The solution

**Say:**

“WorkforceOS is an operating system for AI employees. Each employee has a role, work queue, status, and measurable performance. A Workforce Engine passes structured work between them, while human approval gates keep people in control of consequential decisions.”

“Our wedge is recruiting. Maya, the AI Recruiter, turns a PDF resume into structured evidence and a recommendation. A human approves the candidate. Then Theo in Sales and Nora in Customer Support can receive the next onboarding tasks automatically.”

### 1:35-2:05 - Why it is different

**Say:**

“A chatbot answers one prompt. A generic automation tool connects boxes. WorkforceOS models the organization itself: who is working, what they produced, why work is waiting, where a person must decide, and what happened next.”

“The key idea is not autonomous AI at any cost. It is observable AI collaboration with human judgment built into the workflow.”

### 2:05-2:30 - Business and expansion

**Say:**

“We would sell this as a workspace subscription with AI-employee packs and usage-based execution. Recruiting is the entry point for startups, agencies, and lean HR teams; the same workforce layer then expands into sales, support, finance, and operations. Let me show the complete loop working.”

## 2:30-6:30 - Working MVP demo

### 2:30-2:55 - Command center

**Click:** Start on **Dashboard / Overview**.

**Say:**

“This is the command center. I can see active AI employees, current work, approvals, and recent activity in one place. I can also assign new work directly, but I will start with an actual recruiting task.”

**Click:** Open **AI Employees**, then **Recruiter**.

### 2:55-4:10 - Recruiter analysis

**Connected path:** Open **Resume Review** and upload the prepared PDF. Point out the extracted skills, evidence, score, reasoning, and recommended role.

**Demo path:** Open **Resume Review** and choose the clearly labeled fictional demo result. Point out the same structured fields, but say no model request was made for this result.

**Say for the connected path while it runs:**

“The browser sends the PDF to our internal Next.js API. On the server we enforce the file limit, validate the PDF, extract bounded text, and call the OpenAI Responses API. The key never reaches the browser. We require a strict JSON schema and validate the result again before rendering it.”

**Point out:** candidate name, experience, AI score, decision, skills, strengths, weaknesses, reasoning, and recommended role. In the connected path, also show upload progress and loading state.

**Say:**

“This is structured evidence a workflow can use—not an untraceable paragraph of generated text. The score supports the reviewer; it does not make the final hiring decision.”

**Click:** Open **Candidates**, select the analyzed candidate, and briefly show the detail drawer.

### 4:10-4:50 - Human decision

**Click:** Open **Approvals** and choose **Request interview** or **Approve** on a pending candidate.

**Say:**

“Sensitive decisions stop here. The reviewer can approve, reject, or request an interview. In connected mode the decision is stored in the workspace database; in demo mode it remains in this browser.”

“This is our control model: AI prepares and routes the work; a person owns the decision.”

### 4:50-5:55 - Workforce Engine

**Click:** Open **Workflows**, select the resume-to-onboarding workflow, and press **Run Workflow**.

**Say:**

“Now the same work becomes a cross-functional process. Watch the status move through the handoff and stop at a human approval gate.”

**At the pause:** Point to **Waiting** and the live execution log, then click **Approve**.

**Say:**

“The workflow is intentionally paused and visible. In connected mode, the run and approval are persisted and the AI employees produce drafts for review. In demo mode, the handoffs are a labeled browser-local simulation. No email or welcome package is sent externally.”

**Point out:** completed nodes, animated edges, and the finished execution.

### 5:55-6:30 - Outcome visibility

**Click:** Open **Analytics**.

**Say:**

“Finally, managers can inspect throughput, execution outcomes, and approval activity. Connected metrics come from stored work; demo figures are examples. Reports can be filtered and exported.”

## 6:30-7:00 - Close

**Say:**

“This MVP demonstrates the full product loop: structured resume review, a human decision, an observable multi-agent handoff, and outcome visibility. The connected implementation supports a real AI analysis and persisted steps; the public demo path is explicitly local and simulated.”

“The architecture already separates the UI, API, AI service, workflow engine, and tenant-scoped storage. The production path from here is a durable background worker, distributed limits, real integrations, and operational monitoring.”

“WorkforceOS turns AI tools into an accountable workforce—specialized, coordinated, and always under human control.”

Stop. Do not fill the remaining silence. Invite questions.

## Recovery plan during the live demo

### If connected resume analysis takes more than 15 seconds

Keep the upload running and say: “While the server completes the analysis, I’ll show how an already processed candidate moves through the rest of the system.” Open a candidate you prepared in the connected workspace before the meeting, complete an approval, and continue to the Workforce Engine. Return to the result only if time remains.

### If connected OpenAI analysis returns a configuration, quota, or network error

Say: “The interface is showing the recovery state rather than inventing a result. I’ll continue with a previously processed candidate or the clearly labeled fictional demo so you can see the downstream workflow.” Never claim that a failed model request succeeded.

### If the production site is unavailable

Switch once to the already-running local build. If that also fails, use the backup recording and narrate the same click path. Do not spend presentation time debugging infrastructure.

### If time is running out

Skip the candidate drawer and Analytics. Always preserve the resume result, human approval, Workforce Engine run, and final sentence.
