# Deployment guide

## Prerequisites

- A GitHub repository containing this project.
- A Vercel account connected to that repository.
- A PostgreSQL database for connected workspaces.
- An OpenAI API project with billing or available credits for resume analysis.

## Deploy to Vercel

1. In Vercel, choose **Add New → Project** and import `Anubhav-2005/workforceos`.
2. Keep the framework preset as **Next.js**. The committed `vercel.json` sets the deployment build command to `npm run build:deployment`.
3. In **Settings → Environment Variables**, add the variables below for Production (and Preview if desired):

   ```text
   DATABASE_URL=postgresql://...
   OPENAI_API_KEY=...
   OPENAI_MODEL=gpt-5.6-terra
   NEXT_PUBLIC_APP_URL=https://workforceos-bay.vercel.app
   ```

4. If using Neon's native integration, connect the database to the intended Vercel environment without a custom variable prefix. It supplies `DATABASE_URL` for runtime access and `DATABASE_URL_UNPOOLED` for schema changes. Keep database secrets server-side.
5. Deploy the project. `npm run build:deployment` generates Prisma Client, applies committed migrations, then builds the app. It prefers the direct URL for migrations without changing the runtime URL, and stops deployment if migration fails. Without a database it builds the labeled demo. Never use `migrate reset` or `db push` to prepare a shared deployment. `npm run db:deploy` remains available for manual migrations from a trusted terminal.
6. If Vercel assigns a different final URL, update `NEXT_PUBLIC_APP_URL` and redeploy.

`OPENAI_API_KEY` must be entered in Vercel; do not add `.env.local` to Git or paste a key into source code. Rotate any key that has been pasted into a chat or issue. The app uses the Node.js runtime and allows up to 60 seconds for PDF extraction and analysis. The PDF parser and its native canvas dependency are kept external in `next.config.ts` so Vercel includes the correct Linux runtime files.

If `DATABASE_URL` is absent, the deployment intentionally stays in an amber-bannered browser-local demo mode. Live AI routes, shared accounts, and database persistence are disabled there. Do not describe that mode as a live multi-user deployment.

## Post-deploy verification

1. Visit `/` and `/dashboard`; confirm sign-in is required in connected mode. Create an account at `/sign-up`.
2. Check desktop and mobile widths.
3. Upload a text-based PDF under 4 MB in **Recruiter → Resume Review**.
4. Confirm a successful structured analysis, or a helpful configuration/quota error if the OpenAI project is unavailable.
5. Approve or reject a candidate and refresh to confirm database persistence.
6. Start **Candidate onboarding** in **Workflows**, confirm it pauses at the human gate, approve, then continue the queued run and inspect its steps/draft.
7. Create a task, run it, and review the saved draft.
8. Export a CSV from Analytics and sign out/sign back in to confirm workspace isolation.

## Troubleshooting

| Symptom                                   | Likely cause                                      | Resolution                                                            |
| ----------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| Resume analysis says it is not configured | Missing `OPENAI_API_KEY`                          | Add the variable in Vercel and redeploy.                              |
| Resume analysis says no remaining quota   | OpenAI project billing or credits are unavailable | Add billing/credits or use an API key from a funded project.          |
| PDF is rejected                           | Unsupported, oversized, or scanned PDF            | Use a text-based PDF smaller than 4 MB.                               |
| Metadata links use localhost              | `NEXT_PUBLIC_APP_URL` is unset or invalid         | Set the deployed absolute URL and redeploy.                           |
| Amber Demo workspace banner               | `DATABASE_URL` is absent                          | Provision Postgres, apply migrations, set the variable, and redeploy. |
| Database-backed routes fail               | Invalid database URL or missing migration         | Check connectivity and run `npm run db:deploy`.                       |
| Local state differs between browsers      | Browser-local demo mode                           | Expected only without `DATABASE_URL`; connected mode is shared.       |

## Rollback

Use Vercel’s deployment history to promote a previous healthy deployment. For source rollback, revert the relevant Git commit and redeploy; never use a source rollback to solve a credential issue—replace or revoke the credential in the environment configuration instead.
