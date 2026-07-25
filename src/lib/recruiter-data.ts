import type { RecruiterAnalysis } from "@/types/recruiter";

export type HumanStatus = "Pending approval" | "Approved" | "Rejected" | "Interview requested";

export type Candidate = {
  id: string;
  name: string;
  role: string;
  experience: string;
  skills: string[];
  resumeStatus: "Reviewed" | "Processing" | "Needs review";
  aiScore: number;
  humanStatus: HumanStatus;
  summary: string;
  analysis?: RecruiterAnalysis;
};

const humanStatuses: HumanStatus[] = ["Pending approval", "Approved", "Rejected", "Interview requested"];
const resumeStatuses: Candidate["resumeStatus"][] = ["Reviewed", "Processing", "Needs review"];

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
        typeof candidate.summary === "string",
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
    humanStatus: "Pending approval",
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
    resumeStatus: "Needs review",
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
    humanStatus: "Pending approval",
    summary: "Promising visual designer with an evolving product portfolio.",
  },
];
