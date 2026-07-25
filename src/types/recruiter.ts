export const recruiterDecisions = ["Hire", "Maybe", "Reject"] as const;

export type RecruiterDecision = (typeof recruiterDecisions)[number];

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
};

export const recruiterAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "candidateName",
    "email",
    "phone",
    "yearsExperience",
    "currentRole",
    "skills",
    "strengths",
    "weaknesses",
    "education",
    "projects",
    "recommendedRole",
    "score",
    "decision",
    "reasoning",
  ],
  properties: {
    candidateName: { type: "string" },
    email: { type: "string" },
    phone: { type: "string" },
    yearsExperience: { type: "number" },
    currentRole: { type: "string" },
    skills: { type: "array", items: { type: "string" } },
    strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
    education: { type: "array", items: { type: "string" } },
    projects: { type: "array", items: { type: "string" } },
    recommendedRole: { type: "string" },
    score: { type: "number", minimum: 0, maximum: 100 },
    decision: { type: "string", enum: recruiterDecisions },
    reasoning: { type: "string" },
  },
} as const;

export function parseRecruiterAnalysis(value: string): RecruiterAnalysis {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    const jsonCandidate = extractJsonObject(value);
    if (!jsonCandidate) throw new Error("The AI returned malformed analysis data.");
    try {
      parsed = JSON.parse(jsonCandidate);
    } catch {
      throw new Error("The AI returned malformed analysis data.");
    }
  }
  if (
    !isRecord(parsed) ||
    !isStringArray(parsed.skills) ||
    !isStringArray(parsed.strengths) ||
    !isStringArray(parsed.weaknesses) ||
    !isStringArray(parsed.education) ||
    !isStringArray(parsed.projects) ||
    !isRecruiterDecision(parsed.decision)
  ) {
    throw new Error("The AI returned an incomplete analysis.");
  }
  const { candidateName, email, phone, currentRole, recommendedRole, reasoning, yearsExperience, score } = parsed;
  if (
    typeof candidateName !== "string" ||
    typeof email !== "string" ||
    typeof phone !== "string" ||
    typeof currentRole !== "string" ||
    typeof recommendedRole !== "string" ||
    typeof reasoning !== "string" ||
    typeof yearsExperience !== "number" ||
    typeof score !== "number"
  ) {
    throw new Error("The AI returned an invalid analysis format.");
  }
  return {
    candidateName,
    email,
    phone,
    yearsExperience: Math.max(0, Math.round(yearsExperience)),
    currentRole,
    skills: parsed.skills,
    strengths: parsed.strengths,
    weaknesses: parsed.weaknesses,
    education: parsed.education,
    projects: parsed.projects,
    recommendedRole,
    score: Math.max(0, Math.min(100, Math.round(score))),
    decision: parsed.decision,
    reasoning,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isRecruiterDecision(value: unknown): value is RecruiterDecision {
  return typeof value === "string" && recruiterDecisions.includes(value as RecruiterDecision);
}

function extractJsonObject(value: string) {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  return start >= 0 && end > start ? value.slice(start, end + 1) : null;
}
