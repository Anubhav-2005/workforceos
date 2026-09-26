import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

type DeploymentEnvironment = { DATABASE_URL?: string; DATABASE_URL_UNPOOLED?: string };

/** Use Neon's direct connection for schema changes, and its pool for app traffic. */
export function migrationConnection(environment: DeploymentEnvironment): string | null {
  if (!environment.DATABASE_URL?.trim()) return null;
  const connection = environment.DATABASE_URL_UNPOOLED?.trim() || environment.DATABASE_URL.trim();
  let url: URL;
  try {
    url = new URL(connection);
  } catch {
    throw new Error("The deployment database connection is not a valid URL.");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("The deployment database must use PostgreSQL.");
  }
  return connection;
}

export function redactMigrationOutput(output: string, connection: string): string {
  const url = new URL(connection);
  const secrets = [connection, url.password];
  try {
    secrets.push(decodeURIComponent(url.password));
  } catch {
    // A malformed percent escape must not prevent redacting the original value.
  }
  return [...new Set(secrets)]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .reduce((text, secret) => text.replaceAll(secret, "[redacted]"), output);
}

function main(): void {
  const connection = migrationConnection({
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
  });
  if (!connection) {
    console.log("No database configured; building the labeled local demo.");
    return;
  }
  console.log("Applying committed WorkforceOS database migrations.");
  const result = spawnSync(process.execPath, [resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: connection },
    encoding: "utf8",
    timeout: 120_000,
    maxBuffer: 2 * 1024 * 1024,
  });
  for (const output of [result.stdout, result.stderr]) {
    if (output?.trim()) console.log(redactMigrationOutput(output.trim(), connection));
  }
  if (result.error || result.status !== 0) {
    throw new Error("Database migration failed. The app will not deploy with an incomplete schema.");
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve("scripts/migrate-deployment.ts")) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Deployment database setup failed.");
    process.exitCode = 1;
  }
}
