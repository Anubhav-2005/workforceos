import OpenAI from "openai";

export type AIServiceFailure = {
  message: string;
  status: number;
  category: "timeout" | "network" | "quota" | "rate_limit" | "credentials" | "model" | "service";
};

const quotaMessages: Record<string, string> = {
  credit_balance_exhausted: "The OpenAI credit balance is exhausted. The workspace owner must add API credits.",
  organization_spend_limit_exceeded:
    "The OpenAI organization spend limit has been reached. Ask the workspace owner to check the API limits.",
  project_spend_limit_exceeded:
    "The OpenAI project spend limit has been reached. Ask the workspace owner to check the API limits.",
  organization_usage_limit_exceeded:
    "The OpenAI organization usage limit has been reached. Ask the workspace owner to check the API limits.",
  insufficient_quota:
    "The OpenAI project has no available quota. The workspace owner must check API billing and limits.",
};

/** Never return the provider's raw message: it can contain request or credential data. */
export function describeAIServiceFailure(error: unknown): AIServiceFailure | null {
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return { category: "timeout", status: 504, message: "The AI service timed out. Please try again." };
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return { category: "network", status: 502, message: "Unable to reach the AI service. Please try again." };
  }
  if (!(error instanceof OpenAI.APIError)) return null;

  const quotaMessage =
    quotaMessages[error.code ?? ""] ??
    (error.type === "insufficient_quota" ? quotaMessages.insufficient_quota : undefined);
  if (quotaMessage) return { category: "quota", status: 503, message: quotaMessage };
  if (error.status === 429) {
    return {
      category: "rate_limit",
      status: 429,
      message:
        "OpenAI is rate limited. Wait before retrying; if this continues, ask the workspace owner to check API limits.",
    };
  }
  if (error.status === 401 || error.status === 403) {
    return {
      category: "credentials",
      status: 503,
      message:
        "The OpenAI credentials need attention. Ask the workspace owner to check the server API key and permissions.",
    };
  }
  if (error.status === 404 || error.code === "model_not_found") {
    return {
      category: "model",
      status: 503,
      message: "The configured AI model is unavailable. Ask the workspace owner to check model access.",
    };
  }
  if (error.status === 408 || error.status === 504) {
    return { category: "timeout", status: 504, message: "The AI service timed out. Please try again." };
  }
  return {
    category: "service",
    status: 502,
    message: "The AI service could not complete this request. Please try again later.",
  };
}

/** Log only safe diagnostic metadata, never prompts, resumes, headers, or raw errors. */
export function logAIServiceFailure(operation: "recruiter" | "workflow", error: unknown): void {
  const failure = describeAIServiceFailure(error);
  if (!failure) return;
  console.warn("WorkforceOS AI request failed", {
    operation,
    category: failure.category,
    status: error instanceof OpenAI.APIError ? error.status : undefined,
    code: error instanceof OpenAI.APIError && /^[a-z_]{1,64}$/.test(error.code ?? "") ? error.code : undefined,
    requestId:
      error instanceof OpenAI.APIError && /^req_[a-zA-Z0-9_-]{1,100}$/.test(error.requestID ?? "")
        ? error.requestID
        : undefined,
  });
}
