import OpenAI from "openai";
import { z } from "zod";
import { EnvironmentConfigurationError } from "@/lib/env";
import { analyzeRecruiterResume, RecruiterAIError } from "@/lib/ai/analyzeRecruiterResume";
import { apiError } from "@/lib/api/http";
import { assertSameOrigin, requireWorkspaceContext } from "@/lib/auth/session";
import { extractResumeText, MAX_MULTIPART_BYTES, ResumeFileError } from "@/lib/pdf/extractResumeText";
import { persistRecruiterAnalysis } from "@/lib/recruiter/persist-analysis";
import { checkRateLimit } from "@/lib/rateLimit";
import type { RecruiterJobCriteria } from "@/types/recruiter";

export const runtime = "nodejs";
export const maxDuration = 60;

const RATE_LIMIT_REQUESTS = 8;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000;

const jobCriteriaSchema = z.strictObject({
  title: z.string().trim().max(160),
  description: z.string().trim().max(8_000),
  requiredSkills: z.array(z.string().trim().min(1).max(100)).max(30),
  preferredSkills: z.array(z.string().trim().min(1).max(100)).max(30),
  minimumYearsExperience: z.number().min(0).max(80).nullable(),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await requireWorkspaceContext();
    const rateLimit = checkRateLimit(`${context.organization.id}:${getRequestIdentifier(request)}`, {
      limit: RATE_LIMIT_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      return jsonError("Too many resume analyses. Please wait a few minutes and try again.", 429, {
        "Retry-After": String(Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1_000))),
      });
    }
    if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
      return jsonError("Upload the resume as multipart form data.", 415);
    }
    if (Number(request.headers.get("content-length") ?? 0) > MAX_MULTIPART_BYTES) {
      return jsonError("Resume files must be 4 MB or smaller.", 413);
    }

    const formData = await readBoundedMultipart(request);
    const resume = formData.get("resume");
    if (!(resume instanceof File)) return jsonError("Please choose a PDF resume.", 400);
    const jobCriteria = parseJobCriteria(formData);
    const resumeText = await extractResumeText(resume);
    const result = await analyzeRecruiterResume(resumeText, jobCriteria);
    const candidateId = await persistRecruiterAnalysis({
      organizationId: context.organization.id,
      userId: context.user.id,
      file: resume,
      result,
    });
    return Response.json(result.analysis, {
      headers: { ...responseHeaders(rateLimit), "X-Candidate-Id": candidateId },
    });
  } catch (error) {
    return handleError(error);
  }
}

async function readBoundedMultipart(request: Request): Promise<FormData> {
  if (!request.body) throw new ResumeFileError("The uploaded resume is empty.", 422);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_MULTIPART_BYTES) {
      await reader.cancel();
      throw new ResumeFileError("Resume files must be 4 MB or smaller.", 413);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Response(bytes, {
    headers: { "Content-Type": request.headers.get("Content-Type") ?? "" },
  }).formData();
}

function parseJobCriteria(form: FormData): RecruiterJobCriteria | null {
  const title = String(form.get("jobTitle") ?? "").trim();
  const description = String(form.get("jobDescription") ?? "").trim();
  const requiredSkills = parseSkillList(form.get("requiredSkills"));
  const preferredSkills = parseSkillList(form.get("preferredSkills"));
  const rawYears = form.get("minimumYearsExperience");
  const years = typeof rawYears === "string" && rawYears.trim() ? Number(rawYears) : null;
  if (!title && !description && !requiredSkills.length && !preferredSkills.length && years === null) return null;
  return jobCriteriaSchema.parse({
    title,
    description,
    requiredSkills,
    preferredSkills,
    minimumYearsExperience: years,
  });
}

function parseSkillList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getRequestIdentifier(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "anonymous";
}

function handleError(error: unknown) {
  if (error instanceof ResumeFileError) return jsonError(error.message, error.status);
  if (error instanceof RecruiterAIError) return jsonError(error.message, error.reason === "refusal" ? 422 : 502);
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
  if (error instanceof EnvironmentConfigurationError && error.variable === "OPENAI_API_KEY") {
    return jsonError("Resume analysis is not configured. Add OPENAI_API_KEY to the server environment.", 503);
  }
  return apiError(error);
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
