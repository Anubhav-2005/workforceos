# Contributing to WorkforceOS

## Development workflow

1. Create a focused branch for the change.
2. Keep changes within the existing App Router and component architecture.
3. Preserve the established visual language unless the issue explicitly calls for a design update.
4. Add accessible names, keyboard behavior, loading states, and failure states to new interactions.
5. Run the complete local quality check before opening a pull request.

```bash
npm install
cp .env.example .env.local
npm run check
npm run build
```

## Code expectations

- Use strict TypeScript and avoid `any`.
- Keep client components focused on browser state and interaction.
- Keep secrets and OpenAI calls in server-only modules.
- Prefer small domain components over large page files.
- Reuse existing state and service layers before introducing new abstractions.
- Do not commit environment files, generated build output, or API credentials.

## Pull requests

Describe the user-facing outcome, testing performed, and any environment changes. Include screenshots for visible UI changes and call out changes to API behavior or persistence.
