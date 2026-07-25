import { ArrowUpRight, FileCheck2 } from "lucide-react";
import type { Candidate } from "@/lib/recruiter-data";
import ScoreBadge from "@/components/recruiter/ScoreBadge";

export default function CandidateCard({ candidate, onSelect }: { candidate: Candidate; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="group w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-[0_2px_12px_rgba(15,23,42,0.035)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
    >
      <div className="flex items-start justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-sm font-bold text-violet-700">
          {candidate.name
            .split(" ")
            .map((word) => word[0])
            .join("")}
        </div>
        <ArrowUpRight size={17} className="text-slate-300 transition group-hover:text-indigo-600" />
      </div>
      <p className="mt-4 text-sm font-bold text-slate-900">{candidate.name}</p>
      <p className="mt-1 text-xs text-slate-500">
        {candidate.role} · {candidate.experience}
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {candidate.skills.slice(0, 3).map((skill) => (
          <span key={skill} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
            {skill}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
          <FileCheck2 size={13} className="text-emerald-500" /> {candidate.resumeStatus}
        </span>
        <ScoreBadge score={candidate.aiScore} />
      </div>
    </button>
  );
}
