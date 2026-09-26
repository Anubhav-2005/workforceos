import assert from "node:assert/strict";
import test from "node:test";
import OpenAI from "openai";
import { describeAIServiceFailure } from "../src/lib/ai/errors";

function apiError(status: number, code: string, type?: string) {
  return new OpenAI.APIError(status, { code, type }, "Sensitive provider details must stay private", new Headers());
}

test("billing and spend failures are not presented as temporary rate limits", () => {
  for (const code of [
    "credit_balance_exhausted",
    "organization_spend_limit_exceeded",
    "project_spend_limit_exceeded",
    "organization_usage_limit_exceeded",
    "insufficient_quota",
  ]) {
    const failure = describeAIServiceFailure(apiError(429, code));
    assert.equal(failure?.category, "quota");
    assert.equal(failure?.status, 503);
    assert.doesNotMatch(failure?.message ?? "", /Sensitive|retrying/);
  }
  assert.equal(
    describeAIServiceFailure(apiError(429, "unknown_billing_code", "insufficient_quota"))?.category,
    "quota",
  );
});

test("temporary limits, credentials, model access and timeouts have distinct messages", () => {
  assert.equal(describeAIServiceFailure(apiError(429, "rate_limit_exceeded"))?.category, "rate_limit");
  assert.equal(describeAIServiceFailure(apiError(401, "invalid_api_key"))?.category, "credentials");
  assert.equal(describeAIServiceFailure(apiError(404, "model_not_found"))?.category, "model");
  assert.equal(describeAIServiceFailure(new OpenAI.APIConnectionTimeoutError())?.category, "timeout");
  assert.equal(
    describeAIServiceFailure(new OpenAI.APIConnectionError({ message: "private network detail" }))?.category,
    "network",
  );
  assert.equal(describeAIServiceFailure(new Error("local validation failed")), null);
});
