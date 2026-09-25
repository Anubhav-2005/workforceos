import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAIClient, getRecruiterModel } from "@/lib/openai";
import {
  buildRecruiterResumeInput,
  RECRUITER_PROMPT_VERSION,
  RECRUITER_SYSTEM_PROMPT,
} from "@/lib/prompts/recruiterPrompt";
import {
  parseRecruiterAnalysis,
  recruiterModelAnalysisSchema,
  type RecruiterAnalysis,
  type RecruiterJobCriteria,
} from "@/types/recruiter";

export type RecruiterAnalysisResult = {
  analysis: RecruiterAnalysis;
  model: string;
  promptVersion: string;
  requestId: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  } | null;
};

export class RecruiterAIError extends Error {
  constructor(
    message: string,
    readonly reason: "refusal" | "incomplete" | "malformed",
  ) {
    super(message);
    this.name = "RecruiterAIError";
  }
}

export async function analyzeRecruiterResume(
  resumeText: string,
  jobCriteria: RecruiterJobCriteria | null,
): Promise<RecruiterAnalysisResult> {
  const model = getRecruiterModel();
  let parseError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await getOpenAIClient().responses.create({
      model,
      instructions: RECRUITER_SYSTEM_PROMPT,
      input: buildRecruiterResumeInput(resumeText, jobCriteria),
      max_output_tokens: 3_200,
      store: false,
      text: { format: zodTextFormat(recruiterModelAnalysisSchema, "recruiter_analysis") },
    });

    if (getRefusal(response)) {
      throw new RecruiterAIError("The AI could not analyze this document.", "refusal");
    }
    if (response.status !== "completed" || !response.output_text) {
      throw new RecruiterAIError("The AI did not complete the resume analysis.", "incomplete");
    }

    try {
      const analysis = parseRecruiterAnalysis(response.output_text);
      return {
        analysis,
        model: response.model,
        promptVersion: RECRUITER_PROMPT_VERSION,
        requestId: response._request_id ?? null,
        usage: response.usage
          ? {
              inputTokens: response.usage.input_tokens,
              outputTokens: response.usage.output_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : null,
      };
    } catch (error) {
      parseError = error instanceof Error ? error : new Error("The AI returned malformed analysis data.");
    }
  }

  throw new RecruiterAIError(parseError?.message ?? "The AI returned malformed analysis data.", "malformed");
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
