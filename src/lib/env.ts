import "server-only";

export class EnvironmentConfigurationError extends Error {
  constructor(
    readonly variable: "OPENAI_API_KEY" | "NEXT_PUBLIC_APP_URL",
    message = `${variable} is not configured.`,
  ) {
    super(message);
    this.name = "EnvironmentConfigurationError";
  }
}

export function getRequiredServerEnv(name: "OPENAI_API_KEY"): string {
  const value = process.env[name]?.trim();
  if (!value) throw new EnvironmentConfigurationError(name);
  return value;
}

export function getAppUrl(): URL {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configuredUrl) return new URL("http://localhost:3000");

  try {
    return new URL(configuredUrl);
  } catch {
    throw new EnvironmentConfigurationError("NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_APP_URL must be an absolute URL.");
  }
}
