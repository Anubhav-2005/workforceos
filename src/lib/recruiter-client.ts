import type { Candidate, HumanStatus, RecruiterAnalysisSource } from "@/lib/recruiter-data";
import type { RecruiterAnalysis } from "@/types/recruiter";

type CandidateRecord = {
  id: string;
  name: string;
  email: string | null;
  currentRole: string | null;
  yearsExperience: number | null;
  aiScore: number | null;
  status: string;
  analyses: { result: unknown; source: string }[];
  approvals: { id: string; status: string }[];
};

export function isCandidateRecord(value: unknown): value is CandidateRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.status === "string" &&
    Array.isArray(record.analyses) &&
    Array.isArray(record.approvals)
  );
}

function isAnalysis(value: unknown): value is RecruiterAnalysis {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.candidateName === "string" &&
    typeof record.score === "number" &&
    Array.isArray(record.skills) &&
    typeof record.reasoning === "string"
  );
}

export function toCandidate(record: CandidateRecord): Candidate {
  const latest = record.analyses[0];
  const analysis = latest && isAnalysis(latest.result) ? latest.result : undefined;
  const pending = record.approvals.find((approval) => approval.status === "Pending");
  const humanStatus: HumanStatus =
    record.status === "Approved" || record.status === "Hired" || record.status === "Onboarding"
      ? "Approved"
      : record.status === "Rejected"
        ? "Rejected"
        : record.status === "InterviewRequested" || record.status === "Interviewing"
          ? "Interview requested"
          : pending
            ? "Pending approval"
            : "Awaiting analysis";
  const source: RecruiterAnalysisSource = latest?.source === "demo" ? "demo" : "openai";
  return {
    id: record.id,
    approvalId: pending?.id,
    email: record.email,
    name: record.name,
    role: analysis?.recommendedRole || record.currentRole || "Role not identified",
    experience: `${record.yearsExperience ?? analysis?.yearsExperience ?? 0} years`,
    skills: analysis?.skills ?? [],
    resumeStatus: analysis ? "Reviewed" : "Needs review",
    aiScore: record.aiScore ?? 0,
    humanStatus,
    summary: analysis?.reasoning ?? "No analysis has been completed yet.",
    analysis,
    analysisSource: source,
  };
}
