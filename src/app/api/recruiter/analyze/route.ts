import OpenAI from "openai";
import { EnvironmentConfigurationError } from "@/lib/env";
import { getOpenAIClient } from "@/lib/openai";
import { buildRecruiterResumeInput, RECRUITER_SYSTEM_PROMPT } from "@/lib/prompts/recruiterPrompt";
import { checkRateLimit } from "@/lib/rateLimit";
import { parseRecruiterAnalysis, recruiterAnalysisJsonSchema, type RecruiterAnalysis } from "@/types/recruiter";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const MAX_RESUME_CHARACTERS = 60_000;
const MIN_RESUME_CHARACTERS = 40;
const RATE_LIMIT_REQUESTS = 8;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000;

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(getRequestIdentifier(request), {
    limit: RATE_LIMIT_REQUESTS,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    return jsonError("Too many resume analyses. Please wait a few minutes and try again.", 429, {
      "Retry-After": String(Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1_000))),
    });
  }

  try {
    if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
      return jsonError("Upload the resume as multipart form data.", 415);
    }

    const formData = await request.formData();
    const resume = formData.get("resume");
    if (!(resume instanceof File)) return jsonError("Please choose a PDF resume.", 400);
    if (resume.size === 0) return jsonError("The uploaded resume is empty.", 400);
    if (resume.size > MAX_RESUME_BYTES) return jsonError("Resume files must be 5 MB or smaller.", 413);
    if (!isPdfFile(resume)) return jsonError("Only PDF resumes are supported.", 415);

    const resumeBuffer = Buffer.from(await resume.arrayBuffer());
    if (!hasPdfSignature(resumeBuffer)) return jsonError("This file is not a valid PDF document.", 415);

    const resumeText = await extractPdfText(resumeBuffer);
    if (resumeText.length < MIN_RESUME_CHARACTERS) {
      return jsonError("We could not find enough readable text in this PDF resume.", 422);
    }

    const analysis = await analyzeResumeText(resumeText);
    return Response.json(analysis, { headers: responseHeaders(rateLimit) });
  } catch (error) {
    return handleError(error);
  }
}

async function analyzeResumeText(resumeText: string): Promise<RecruiterAnalysis> {
  let parseError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await getOpenAIClient().responses.create({
      model: "gpt-5.6-terra",
      instructions: RECRUITER_SYSTEM_PROMPT,
      input: buildRecruiterResumeInput(resumeText),
      max_output_tokens: 1_600,
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "recruiter_analysis",
          description: "Structured hiring analysis extracted from a resume.",
          strict: true,
          schema: recruiterAnalysisJsonSchema,
        },
      },
    });

    const refusal = getRefusal(response);
    if (refusal) throw new RecruiterAnalysisError("The AI could not analyze this document.", "refusal");
    if (response.status !== "completed" || !response.output_text) {
      throw new RecruiterAnalysisError("The AI did not complete the resume analysis.", "incomplete");
    }

    try {
      return parseRecruiterAnalysis(response.output_text);
    } catch (error) {
      parseError = error instanceof Error ? error : new Error("The AI returned malformed analysis data.");
    }
  }

  throw parseError ?? new Error("The AI returned malformed analysis data.");
}

async function extractPdfText(data: Buffer) {
  const { CanvasFactory } = await import("pdf-parse/worker");
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data, CanvasFactory });
  try {
    const result = await parser.getText();
    return result.text
      .replace(/\0/g, "")
      .replace(/[^\S\r\n]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, MAX_RESUME_CHARACTERS);
  } finally {
    await parser.destroy();
  }
}

function getRefusal(response: OpenAI.Responses.Response) {
  for (const output of response.output) {
    if (output.type !== "message") continue;
    for (const content of output.content) {
      if (content.type === "refusal") return content.refusal;
    }
  }
  return null;
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function hasPdfSignature(data: Buffer) {
  return data.subarray(0, 5).toString("ascii") === "%PDF-";
}

function getRequestIdentifier(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "anonymous";
}

function handleError(error: unknown) {
  if (error instanceof OpenAI.APIConnectionTimeoutError)
    return jsonError("The AI analysis timed out. Please try again.", 504);
  if (error instanceof OpenAI.APIConnectionError)
    return jsonError("Unable to reach the AI service. Please check your connection and try again.", 502);
  if (error instanceof OpenAI.APIError) {
    if (error.code === "insufficient_quota")
      return jsonError(
        "Resume analysis is temporarily unavailable because the AI project has no remaining quota.",
        503,
      );
    if (error.status === 429) return jsonError("The AI service is busy. Please try again in a moment.", 429);
    if (error.status === 408 || error.status === 504)
      return jsonError("The AI analysis timed out. Please try again.", 504);
    return jsonError("The AI service could not analyze this resume right now.", 502);
  }
  if (error instanceof RecruiterAnalysisError) return jsonError(error.message, error.reason === "refusal" ? 422 : 502);
  if (error instanceof EnvironmentConfigurationError && error.variable === "OPENAI_API_KEY") {
    return jsonError("Resume analysis is not configured. Add OPENAI_API_KEY to the server environment.", 503);
  }
  if (error instanceof Error && error.message.startsWith("The AI returned")) return jsonError(error.message, 502);
  return jsonError("Unable to read this PDF resume. Please upload another file.", 422);
}

function jsonError(error: string, status: number, headers: HeadersInit = {}) {
  return Response.json(
    { error },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...headers,
      },
    },
  );
}

function responseHeaders(rateLimit: ReturnType<typeof checkRateLimit>) {
  return {
    "Cache-Control": "no-store",
    "X-RateLimit-Limit": String(rateLimit.limit),
    "X-RateLimit-Remaining": String(rateLimit.remaining),
  };
}

class RecruiterAnalysisError extends Error {
  constructor(
    message: string,
    readonly reason: "refusal" | "incomplete",
  ) {
    super(message);
    this.name = "RecruiterAnalysisError";
  }
}
