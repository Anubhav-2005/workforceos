# Security policy

## Reporting a vulnerability

Please report security issues privately to the project maintainers. Do not include secrets, API keys, private resumes, or personally identifiable candidate information in a public issue.

## Supported version

The latest version on the default branch receives security updates.

## Data handling

WorkforceOS currently stores dashboard state in the browser and sends uploaded resumes only to the server-side recruiter endpoint. Resume text is processed for the active analysis request and is not intentionally persisted by the application or OpenAI request configuration.

Production deployments should add authenticated workspaces, shared distributed rate limiting, encrypted durable storage, centralized audit logs, and a documented data-retention policy.
