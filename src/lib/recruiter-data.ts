import type { RecruiterAnalysis } from "@/types/recruiter";

export type HumanStatus = "Awaiting analysis" | "Pending approval" | "Approved" | "Rejected" | "Interview requested";
export type RecruiterAnalysisSource = "openai" | "demo";

export type Candidate = {
  id: string;
  approvalId?: string;
  email?: string | null;
  name: string;
  role: string;
  experience: string;
  skills: string[];
  resumeStatus: "Reviewed" | "Processing" | "Needs review";
  aiScore: number;
  humanStatus: HumanStatus;
  summary: string;
  analysis?: RecruiterAnalysis;
  analysisSource?: RecruiterAnalysisSource;
};

const humanStatuses: HumanStatus[] = [
  "Awaiting analysis",
  "Pending approval",
  "Approved",
  "Rejected",
  "Interview requested",
];
const resumeStatuses: Candidate["resumeStatus"][] = ["Reviewed", "Processing", "Needs review"];

export type RecruiterMetrics = {
  receivedCount: number;
  reviewedCount: number;
  pendingApprovalCount: number;
  decisionedCount: number;
  approvedCount: number;
  advancedCount: number;
  averageReviewedScore: number;
  approvalRate: number;
};

export function isCandidateAwaitingApproval(candidate: Candidate) {
  return candidate.resumeStatus === "Reviewed" && candidate.humanStatus === "Pending approval";
}

export function getRecruiterMetrics(candidates: Candidate[]): RecruiterMetrics {
  const reviewedCandidates = candidates.filter((candidate) => candidate.resumeStatus === "Reviewed");
  const decisionedCandidates = reviewedCandidates.filter((candidate) =>
    ["Approved", "Rejected", "Interview requested"].includes(candidate.humanStatus),
  );
  const approvedCount = decisionedCandidates.filter((candidate) => candidate.humanStatus === "Approved").length;
  const advancedCount = decisionedCandidates.filter(
    (candidate) => candidate.humanStatus === "Approved" || candidate.humanStatus === "Interview requested",
  ).length;
  const averageReviewedScore = reviewedCandidates.length
    ? Math.round(
        reviewedCandidates.reduce((total, candidate) => total + candidate.aiScore, 0) / reviewedCandidates.length,
      )
    : 0;

  return {
    receivedCount: candidates.length,
    reviewedCount: reviewedCandidates.length,
    pendingApprovalCount: reviewedCandidates.filter(isCandidateAwaitingApproval).length,
    decisionedCount: decisionedCandidates.length,
    approvedCount,
    advancedCount,
    averageReviewedScore,
    approvalRate: decisionedCandidates.length ? Math.round((approvedCount / decisionedCandidates.length) * 100) : 0,
  };
}

export function isCandidateList(value: unknown): value is Candidate[] {
  return (
    Array.isArray(value) &&
    value.every(
      (candidate) =>
        typeof candidate === "object" &&
        candidate !== null &&
        typeof candidate.id === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.role === "string" &&
        typeof candidate.experience === "string" &&
        Array.isArray(candidate.skills) &&
        candidate.skills.every((skill: unknown) => typeof skill === "string") &&
        resumeStatuses.includes(candidate.resumeStatus as Candidate["resumeStatus"]) &&
        typeof candidate.aiScore === "number" &&
        humanStatuses.includes(candidate.humanStatus as HumanStatus) &&
        typeof candidate.summary === "string" &&
        (candidate.analysisSource === undefined || ["openai", "demo"].includes(String(candidate.analysisSource))),
    )
  );
}

export const initialCandidates: Candidate[] = [
  {
    id: "ava-patel",
    name: "Ava Patel",
    role: "Senior Product Designer",
    experience: "6 years",
    skills: ["Figma", "Design systems", "Research"],
    resumeStatus: "Reviewed",
    aiScore: 96,
    humanStatus: "Approved",
    summary: "Strong product craft with clear B2B workflow experience.",
  },
  {
    id: "arjun-mehta",
    name: "Arjun Mehta",
    role: "Product Designer",
    experience: "4 years",
    skills: ["Prototyping", "Mobile", "User testing"],
    resumeStatus: "Reviewed",
    aiScore: 89,
    humanStatus: "Pending approval",
    summary: "Well-rounded generalist with excellent discovery and interaction design skills.",
  },
  {
    id: "sana-rahman",
    name: "Sana Rahman",
    role: "UX Researcher",
    experience: "5 years",
    skills: ["Research", "Synthesis", "Strategy"],
    resumeStatus: "Reviewed",
    aiScore: 84,
    humanStatus: "Interview requested",
    summary: "Deep qualitative research background and strong stakeholder communication.",
  },
  {
    id: "dev-kapoor",
    name: "Dev Kapoor",
    role: "Product Designer",
    experience: "3 years",
    skills: ["Figma", "Web apps", "Visual design"],
    resumeStatus: "Processing",
    aiScore: 78,
    humanStatus: "Awaiting analysis",
    summary: "Resume extraction is in progress; the Recruiter will prepare a recommendation when analysis completes.",
  },
];

export const demoRecruiterAnalysis: RecruiterAnalysis = {
  candidateName: "Riya Sharma",
  email: "riya.sharma@example.com",
  phone: "+91 98765 43210",
  yearsExperience: 5,
  currentRole: "Product Designer",
  skills: ["Figma", "Design systems", "User research", "Prototyping", "B2B SaaS"],
  strengths: [
    "Built and maintained a reusable design system across multiple product teams.",
    "Connects user research findings to measurable product decisions.",
    "Has relevant end-to-end experience designing complex B2B workflows.",
  ],
  weaknesses: [
    "Limited evidence of direct people-management responsibility.",
    "Portfolio impact metrics should be validated during the interview.",
  ],
  education: ["B.Des. in Interaction Design, National Institute of Design"],
  projects: [
    "Redesigned an enterprise onboarding flow and reduced time-to-value by 28%.",
    "Created a multi-brand component library used by four product squads.",
  ],
  recommendedRole: "Senior Product Designer",
  score: 92,
  decision: "Hire",
  reasoning:
    "Riya demonstrates strong product thinking, relevant B2B SaaS experience, and mature design-system practice. A structured interview should validate the reported impact metrics and leadership scope before a final offer.",
};
