import "server-only";
import OpenAI from "openai";
import { getRequiredServerEnv } from "@/lib/env";

let client: OpenAI | undefined;

export function getOpenAIClient() {
  const apiKey = getRequiredServerEnv("OPENAI_API_KEY");
  client ??= new OpenAI({ apiKey, timeout: 45_000, maxRetries: 0 });
  return client;
}
