# Deployment guide

## Prerequisites

- A GitHub repository containing this project.
- A Vercel account connected to that repository.
- An OpenAI API project with billing or available credits for resume analysis.

## Deploy to Vercel

1. In Vercel, choose **Add New → Project** and import `Anubhav-2005/workforceos`.
2. Keep the framework preset as **Next.js** and the default build settings.
3. In **Settings → Environment Variables**, add the variables below for Production (and Preview if desired):

   ```text
   OPENAI_API_KEY=...
   NEXT_PUBLIC_APP_URL=https://workforceos-bay.vercel.app
   ```

4. Deploy the project.
5. If Vercel assigns a different final URL, update `NEXT_PUBLIC_APP_URL` and redeploy.

`OPENAI_API_KEY` must be entered in Vercel; do not add `.env.local` to Git or paste a key into source code. No `vercel.json` is needed: this project uses the standard Next.js runtime, and the resume route explicitly declares its Node.js runtime and 60-second duration. The PDF parser and its native canvas dependency are kept external in `next.config.ts` so Vercel includes the correct Linux runtime files.

## Post-deploy verification

1. Visit `/` and `/dashboard`; confirm redirects, metadata, and dashboard navigation work.
2. Check desktop and mobile widths.
3. Upload a text-based PDF under 5 MB in **Recruiter → Resume Review**.
4. Confirm a successful structured analysis, or a helpful configuration/quota error if the OpenAI project is unavailable.
5. Approve or reject a candidate and refresh to confirm local persistence.
6. Run the Workforce Engine and test the human approval pause.
7. Export a CSV from Analytics.

## Troubleshooting

| Symptom                                   | Likely cause                                      | Resolution                                                   |
| ----------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| Resume analysis says it is not configured | Missing `OPENAI_API_KEY`                          | Add the variable in Vercel and redeploy.                     |
| Resume analysis says no remaining quota   | OpenAI project billing or credits are unavailable | Add billing/credits or use an API key from a funded project. |
| PDF is rejected                           | Unsupported, oversized, or scanned PDF            | Use a text-based PDF smaller than 5 MB.                      |
| Metadata links use localhost              | `NEXT_PUBLIC_APP_URL` is unset or invalid         | Set the deployed absolute URL and redeploy.                  |
| Local state differs between browsers      | MVP uses browser local storage                    | Expected; durable shared state is future work.               |

## Rollback

Use Vercel’s deployment history to promote a previous healthy deployment. For source rollback, revert the relevant Git commit and redeploy; never use a source rollback to solve a credential issue—replace or revoke the credential in the environment configuration instead.
