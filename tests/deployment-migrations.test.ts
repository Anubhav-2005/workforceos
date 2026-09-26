import assert from "node:assert/strict";
import test from "node:test";
import { migrationConnection, redactMigrationOutput } from "../scripts/migrate-deployment";

test("demo builds do not try to migrate a database", () => {
  assert.equal(migrationConnection({}), null);
  assert.equal(migrationConnection({ DATABASE_URL: "  " }), null);
});

test("deployment migrations prefer the direct connection without changing runtime configuration", () => {
  const environment = {
    DATABASE_URL: "postgresql://user:fake-password@pooler.example.test/workforceos",
    DATABASE_URL_UNPOOLED: "postgresql://user:fake-password@direct.example.test/workforceos",
  };
  assert.equal(migrationConnection(environment), environment.DATABASE_URL_UNPOOLED);
  assert.match(environment.DATABASE_URL, /pooler/);
  assert.equal(migrationConnection({ DATABASE_URL: environment.DATABASE_URL }), environment.DATABASE_URL);
});

test("migration setup rejects unsupported and malformed database URLs", () => {
  assert.throws(() => migrationConnection({ DATABASE_URL: "not-a-connection" }), /not a valid URL/);
  assert.throws(() => migrationConnection({ DATABASE_URL: "https://example.test" }), /PostgreSQL/);
});

test("migration output redacts connection strings and encoded passwords", () => {
  const connection = "postgresql://user:fake%40password@db.example.test/workforceos";
  const output = redactMigrationOutput(`Failed: ${connection}; password fake@password or fake%40password`, connection);
  assert.equal(output, "Failed: [redacted]; password [redacted] or [redacted]");
});
