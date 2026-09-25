import assert from "node:assert/strict";
import test from "node:test";
import { parseRecruiterAnalysis } from "../src/types/recruiter";

const validAnalysis = {
  candidateName: "Jordan Lee",
  email: "jordan@example.com",
  phone: "",
  yearsExperience: 5.6,
  currentRole: "Product Designer",
  skills: ["Figma", "Research"],
  strengths: ["Clear portfolio"],
  weaknesses: ["Limited research depth"],
  education: ["B.Des"],
  projects: ["Design system"],
  recommendedRole: "Senior Product Designer",
  score: 82.7,
  decision: "Maybe",
  reasoning: "Promising work, but interview evidence is needed.",
  location: "Remote",
  currentCompany: "Example Co",
  previousCompanies: [],
  technicalSkills: ["Figma"],
  softSkills: ["Communication"],
  risks: [],
  recommendedRoles: ["Senior Product Designer"],
  experienceSummary: "Nearly six years in product design.",
  overallAssessment: "Strong portfolio.",
  jobMatch: {
    provided: true,
    jobTitle: "Senior Product Designer",
    overallFitScore: 79.8,
    skillsMatch: ["Figma"],
    experienceMatch: "Meets the experience threshold.",
    missingRequirements: ["Research leadership"],
    strongMatches: ["Design systems"],
    interviewRecommendation: "Ask about research leadership.",
    suggestedInterviewQuestions: ["How did you validate the design system?"],
    followUpQuestions: [],
  },
};

test("accepts strict structured analysis and rounds display scores", () => {
  const analysis = parseRecruiterAnalysis(JSON.stringify(validAnalysis));
  assert.equal(analysis.candidateName, "Jordan Lee");
  assert.equal(analysis.yearsExperience, 6);
  assert.equal(analysis.score, 83);
  assert.equal(analysis.jobMatch?.overallFitScore, 80);
});

test("rejects markdown, missing fields, unsupported decisions and out-of-range scores", () => {
  assert.throws(() => parseRecruiterAnalysis("```json\n{}\n```"), /malformed/);
  assert.throws(() => parseRecruiterAnalysis(JSON.stringify({ ...validAnalysis, skills: undefined })), /incomplete/);
  assert.throws(
    () => parseRecruiterAnalysis(JSON.stringify({ ...validAnalysis, decision: "Auto-hire" })),
    /incomplete/,
  );
  assert.throws(() => parseRecruiterAnalysis(JSON.stringify({ ...validAnalysis, score: 101 })), /incomplete/);
});
