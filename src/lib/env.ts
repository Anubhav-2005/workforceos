import "server-only";

export function getRequiredServerEnv(name: "OPENAI_API_KEY") {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function getAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configuredUrl) return new URL("http://localhost:3000");

  try {
    return new URL(configuredUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_APP_URL must be an absolute URL.");
  }
}
