# WorkforceOS release checklist

## Completed improvements

- [x] Audited the OpenAI integration and kept one reusable server-only SDK client in `src/lib/openai.ts`.
- [x] Read API credentials from `OPENAI_API_KEY`; no source-code credential is required or exposed to the browser.
- [x] Added typed environment validation and helpful API errors when configuration is missing.
- [x] Added an empty, safe `.env.example` for local and Vercel setup.
- [x] Confirmed environment files are ignored by Git.
- [x] Hardened the resume route with PDF type, extension, signature, size, text-length, timeout, rate-limit, quota, and malformed-output handling.
- [x] Kept prompts, OpenAI client, and file extraction on the server boundary.
- [x] Confirmed the route uses structured OpenAI Responses API output and application-side validation.
- [x] Audited dashboard routes at mobile width and removed a horizontal-overflow issue on the overview page.
- [x] Preserved the existing visual design while keeping interactive state, loading, empty, success, and error states intact.
- [x] Rewrote the repository README with setup, architecture, security, deployment, screenshots, demo, and live-demo placeholders.
- [x] Added hackathon materials: problem statement, architecture, feature inventory, roadmap, demo script, presentation notes, and judges FAQ.
- [x] Added Vercel deployment, production, and launch guides.
- [x] Removed no product features and found no tracked debug logs, TODOs, or commented-out implementation blocks during the final audit.

## Verification completed

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run format:check`
- [x] `npm run build`

## Required manual steps before public submission

- [ ] Rotate the OpenAI key that was shared outside a private secret manager, then put the replacement only in `.env.local` and Vercel.
- [ ] Ensure the selected OpenAI project has billing or available credits; resume analysis currently cannot run when the project reports `insufficient_quota`.
- [ ] Set `OPENAI_API_KEY` and final `NEXT_PUBLIC_APP_URL` in Vercel, then redeploy.
- [ ] Replace the Live Demo, screenshot, GIF, demo video, and presentation placeholders with final submission links/assets.
- [ ] Complete the deployed-environment checks in [docs/production-checklist.md](./docs/production-checklist.md) and [docs/launch-checklist.md](./docs/launch-checklist.md).

## Known MVP boundaries

- Browser state is intentionally stored in local storage; it is not shared between users or browsers.
- Workflow collaboration is an interactive simulation, not yet a durable background job runner.
- The in-memory rate limiter applies per running instance. Use a shared store before scaling traffic.
- Authentication, workspace authorization, encrypted file storage, audit logs, and integration credentials are planned production additions.
