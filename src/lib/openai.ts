import "server-only";
import OpenAI from "openai";
import { getRequiredServerEnv } from "@/lib/env";

let client: OpenAI | undefined;

export function getOpenAIClient(): OpenAI {
  const apiKey = getRequiredServerEnv("OPENAI_API_KEY");
  client ??= new OpenAI({ apiKey, timeout: 45_000, maxRetries: 0 });
  return client;
}

export function getRecruiterModel(): string {
  return process.env.OPENAI_RECRUITER_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || "gpt-5.6-terra";
}
