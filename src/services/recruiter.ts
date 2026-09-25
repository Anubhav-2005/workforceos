import type { RecruiterAnalysis, RecruiterJobCriteria } from "@/types/recruiter";

type AnalyzeResumeOptions = {
  onProgress?: (percent: number) => void;
  jobCriteria?: RecruiterJobCriteria | null;
};

export class RecruiterServiceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "RecruiterServiceError";
  }
}

export function analyzeResume(file: File, { onProgress, jobCriteria }: AnalyzeResumeOptions = {}) {
  return new Promise<RecruiterAnalysis>((resolve, reject) => {
    const request = new XMLHttpRequest();
    const body = new FormData();
    body.append("resume", file);
    if (jobCriteria) {
      body.append("jobTitle", jobCriteria.title);
      body.append("jobDescription", jobCriteria.description);
      body.append("requiredSkills", jobCriteria.requiredSkills.join(", "));
      body.append("preferredSkills", jobCriteria.preferredSkills.join(", "));
      if (jobCriteria.minimumYearsExperience !== null) {
        body.append("minimumYearsExperience", String(jobCriteria.minimumYearsExperience));
      }
    }
    request.open("POST", "/api/recruiter/analyze");
    request.responseType = "json";
    request.timeout = 55_000;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.min(90, Math.round((event.loaded / event.total) * 90)));
    };
    request.onerror = () => reject(new RecruiterServiceError("Network error. Check your connection and try again."));
    request.ontimeout = () => reject(new RecruiterServiceError("The resume analysis timed out. Please try again."));
    request.onload = () => {
      const payload: unknown = request.response;
      if (request.status >= 200 && request.status < 300 && isAnalysisPayload(payload)) {
        onProgress?.(100);
        resolve(payload);
        return;
      }
      reject(
        new RecruiterServiceError(
          isErrorPayload(payload) && payload.error
            ? payload.error
            : request.status === 413
              ? "Resume files must be 4 MB or smaller."
              : request.status >= 500
                ? "The resume service is temporarily unavailable. Try again or use the demo result."
                : "Unable to analyze this resume.",
          request.status,
        ),
      );
    };
    request.send(body);
  });
}

function isErrorPayload(payload: unknown): payload is { error: string } {
  return typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string";
}

function isAnalysisPayload(payload: unknown): payload is RecruiterAnalysis {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "candidateName" in payload &&
    typeof payload.candidateName === "string" &&
    "score" in payload &&
    typeof payload.score === "number" &&
    "skills" in payload &&
    Array.isArray(payload.skills)
  );
}
