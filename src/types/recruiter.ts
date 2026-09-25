import { z } from "zod";

export const recruiterDecisions = ["Hire", "Maybe", "Reject"] as const;

export type RecruiterDecision = (typeof recruiterDecisions)[number];

export type RecruiterJobCriteria = {
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  minimumYearsExperience: number | null;
};

export type RecruiterJobMatch = {
  provided: boolean;
  jobTitle: string;
  overallFitScore: number;
  skillsMatch: string[];
  experienceMatch: string;
  missingRequirements: string[];
  strongMatches: string[];
  interviewRecommendation: string;
  suggestedInterviewQuestions: string[];
  followUpQuestions: string[];
};

// Existing analyses in local workspaces have the original fields only. New AI
// analyses add the optional evidence and job-match fields below.
export type RecruiterAnalysis = {
  candidateName: string;
  email: string;
  phone: string;
  yearsExperience: number;
  currentRole: string;
  skills: string[];
  strengths: string[];
  weaknesses: string[];
  education: string[];
  projects: string[];
  recommendedRole: string;
  score: number;
  decision: RecruiterDecision;
  reasoning: string;
  location?: string;
  currentCompany?: string;
  previousCompanies?: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  risks?: string[];
  recommendedRoles?: string[];
  experienceSummary?: string;
  overallAssessment?: string;
  jobMatch?: RecruiterJobMatch;
};

const jobMatchSchema = z.strictObject({
  provided: z.boolean(),
  jobTitle: z.string(),
  overallFitScore: z.number().min(0).max(100),
  skillsMatch: z.array(z.string()),
  experienceMatch: z.string(),
  missingRequirements: z.array(z.string()),
  strongMatches: z.array(z.string()),
  interviewRecommendation: z.string(),
  suggestedInterviewQuestions: z.array(z.string()),
  followUpQuestions: z.array(z.string()),
});

// This one schema drives both OpenAI's strict response format and server-side
// validation. Keep every property required for Structured Outputs.
export const recruiterModelAnalysisSchema = z.strictObject({
  candidateName: z.string(),
  email: z.string(),
  phone: z.string(),
  yearsExperience: z.number().min(0).max(80),
  currentRole: z.string(),
  skills: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  education: z.array(z.string()),
  projects: z.array(z.string()),
  recommendedRole: z.string(),
  score: z.number().min(0).max(100),
  decision: z.enum(recruiterDecisions),
  reasoning: z.string(),
  location: z.string(),
  currentCompany: z.string(),
  previousCompanies: z.array(z.string()),
  technicalSkills: z.array(z.string()),
  softSkills: z.array(z.string()),
  risks: z.array(z.string()),
  recommendedRoles: z.array(z.string()),
  experienceSummary: z.string(),
  overallAssessment: z.string(),
  jobMatch: jobMatchSchema,
});

export function parseRecruiterAnalysis(value: string): RecruiterAnalysis {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("The AI returned malformed analysis data.");
  }

  const result = recruiterModelAnalysisSchema.safeParse(parsed);
  if (!result.success) throw new Error("The AI returned an incomplete analysis.");

  return {
    ...result.data,
    yearsExperience: Math.round(result.data.yearsExperience),
    score: Math.round(result.data.score),
    jobMatch: {
      ...result.data.jobMatch,
      overallFitScore: Math.round(result.data.jobMatch.overallFitScore),
    },
  };
}
