import type { RecruiterAnalysis } from "@/types/recruiter";

type AnalyzeResumeOptions = {
  onProgress?: (percent: number) => void;
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

export function analyzeResume(file: File, { onProgress }: AnalyzeResumeOptions = {}) {
  return new Promise<RecruiterAnalysis>((resolve, reject) => {
    const request = new XMLHttpRequest();
    const body = new FormData();
    body.append("resume", file);
    request.open("POST", "/api/recruiter/analyze");
    request.responseType = "json";
    request.timeout = 55_000;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.min(90, Math.round((event.loaded / event.total) * 90)));
    };
    request.onerror = () => reject(new RecruiterServiceError("Network error. Check your connection and try again."));
    request.ontimeout = () => reject(new RecruiterServiceError("The resume analysis timed out. Please try again."));
    request.onload = () => {
      const payload = request.response as RecruiterAnalysis | { error?: string } | null;
      if (request.status >= 200 && request.status < 300 && payload && !isErrorPayload(payload)) {
        onProgress?.(100);
        resolve(payload);
        return;
      }
      reject(
        new RecruiterServiceError(
          isErrorPayload(payload) && payload.error
            ? payload.error
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

function isErrorPayload(payload: RecruiterAnalysis | { error?: string } | null): payload is { error?: string } {
  return payload !== null && "error" in payload;
}
