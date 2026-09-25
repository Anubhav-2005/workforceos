# Production checklist

Use this before enabling public traffic.

## Repository and build

- [x] Strict TypeScript, ESLint, and Prettier checks are available.
- [x] Production build command is defined.
- [x] `.env*` is ignored while `.env.example` is tracked.
- [x] No API key is committed in project files.
- [x] OpenAI access is isolated to one server-only client module.

## Resume analysis

- [x] Only PDF uploads are accepted.
- [x] File size is limited to 4 MB.
- [x] File signature and readable extracted text are validated.
- [x] Extracted text is bounded before the model request.
- [x] API errors, timeouts, malformed output, and quota issues return meaningful messages.
- [x] Responses are not cached and OpenAI response storage is disabled.
- [x] A per-instance rate limit is applied.

## Deployment configuration

- [ ] Add a funded `OPENAI_API_KEY` to the Vercel project.
- [ ] Provision PostgreSQL, configure `DATABASE_URL`, and apply committed migrations.
- [ ] Set `NEXT_PUBLIC_APP_URL` to the final HTTPS URL.
- [ ] Verify the API route’s 60-second duration is supported by the selected Vercel plan.
- [ ] Configure a shared rate limiter before a multi-instance or high-traffic rollout.
- [x] Connected mode has sessions, role checks, tenant-scoped records, and candidate deletion.
- [ ] Complete a security/privacy review and retention policy before handling production customer data.

## Product verification

- [ ] Test a successful resume analysis in the deployed environment.
- [ ] Test invalid, empty, scanned, and over-4-MB PDF errors.
- [ ] Test workflow approval and rejection paths.
- [ ] Test analytics CSV export.
- [ ] Test with real target browsers and mobile devices.
