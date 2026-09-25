import { BriefcaseBusiness, CheckCircle2, GraduationCap, Mail, Phone, Sparkles } from "lucide-react";
import type { RecruiterAnalysis as RecruiterAnalysisType } from "@/types/recruiter";
import ScoreBadge from "@/components/recruiter/ScoreBadge";

export default function ResumeAnalysis({
  analysis,
  source = "openai",
}: {
  analysis: RecruiterAnalysisType;
  source?: "openai" | "demo";
}) {
  return (
    <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-4 min-[390px]:flex-row min-[390px]:items-start">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-indigo-600 shadow-sm">
            <Sparkles size={18} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-slate-900">AI resume analysis</p>
              {source === "demo" && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold tracking-wide text-amber-700 uppercase">
                  Demo data
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-xs text-slate-500">
              {analysis.candidateName || "Candidate name not detected"} · {analysis.yearsExperience} years experience
            </p>
          </div>
        </div>
        <ScoreBadge score={analysis.score} />
      </div>

      {(analysis.email || analysis.phone || analysis.currentRole) && (
        <div className="mt-5 grid gap-2 rounded-xl bg-white p-3 sm:grid-cols-2">
          {analysis.currentRole && <Detail icon={<BriefcaseBusiness size={13} />} value={analysis.currentRole} />}
          {analysis.email && <Detail icon={<Mail size={13} />} value={analysis.email} />}
          {analysis.phone && <Detail icon={<Phone size={13} />} value={analysis.phone} />}
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <AnalysisList title="Strengths" values={analysis.strengths} tone="text-emerald-600" />
        <AnalysisList title="Weaknesses" values={analysis.weaknesses} tone="text-amber-600" />
      </div>

      <div className="mt-4 rounded-xl bg-white p-3">
        <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Skills</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {analysis.skills.length ? (
            analysis.skills.map((skill) => (
              <span key={skill} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                {skill}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">No skills detected.</span>
          )}
        </div>

        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
          <p className="text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Decision:</span> {analysis.decision}
          </p>
          <p className="text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Recommended role:</span>{" "}
            {analysis.recommendedRole || "Not identified"}
          </p>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-600">
          <span className="font-semibold text-slate-800">Reasoning:</span> {analysis.reasoning}
        </p>
        <p className="mt-3 text-[10px] text-slate-400">
          AI assessment is decision support, not an automated hiring decision. A person must review the evidence.
        </p>
      </div>

      {analysis.jobMatch?.provided && (
        <div className="mt-4 rounded-xl bg-white p-3">
          <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">
            Match to {analysis.jobMatch.jobTitle || "the role"}
          </p>
          <p className="mt-2 text-sm font-bold text-indigo-600">{analysis.jobMatch.overallFitScore}% fit</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">{analysis.jobMatch.experienceMatch}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <AnalysisList title="Strong matches" values={analysis.jobMatch.strongMatches} tone="text-emerald-600" />
            <AnalysisList
              title="Missing requirements"
              values={analysis.jobMatch.missingRequirements}
              tone="text-amber-600"
            />
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-600">
            <span className="font-semibold text-slate-800">Interview recommendation:</span>{" "}
            {analysis.jobMatch.interviewRecommendation}
          </p>
          {analysis.jobMatch.suggestedInterviewQuestions.length > 0 && (
            <div className="mt-4">
              <AnalysisList
                title="Suggested interview questions"
                values={analysis.jobMatch.suggestedInterviewQuestions}
                tone="text-indigo-600"
              />
            </div>
          )}
        </div>
      )}

      {(analysis.education.length > 0 || analysis.projects.length > 0) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <CompactList icon={<GraduationCap size={14} />} title="Education" values={analysis.education} />
          <CompactList icon={<BriefcaseBusiness size={14} />} title="Projects" values={analysis.projects} />
        </div>
      )}
    </section>
  );
}

function Detail({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <p className="flex min-w-0 items-center gap-2 text-[11px] text-slate-600">
      <span className="shrink-0 text-indigo-500">{icon}</span>
      <span className="truncate">{value}</span>
    </p>
  );
}

function AnalysisList({ title, values, tone }: { title: string; values: string[]; tone: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">{title}</p>
      <ul className="mt-2 space-y-2">
        {values.length ? (
          values.map((value) => (
            <li key={value} className="flex gap-2 text-xs leading-5 text-slate-600">
              <CheckCircle2 size={14} className={`mt-0.5 shrink-0 ${tone}`} />
              {value}
            </li>
          ))
        ) : (
          <li className="text-xs text-slate-400">Not identified from the resume.</li>
        )}
      </ul>
    </div>
  );
}

function CompactList({ icon, title, values }: { icon: React.ReactNode; title: string; values: string[] }) {
  return (
    <div className="rounded-xl border border-indigo-100 bg-white/70 p-3">
      <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">
        {icon}
        {title}
      </p>
      <ul className="mt-2 space-y-1.5">
        {values.map((value) => (
          <li key={value} className="text-[11px] leading-5 text-slate-600">
            {value}
          </li>
        ))}
      </ul>
    </div>
  );
}
