import { CalendarDays, Check, X } from "lucide-react";
import type { Candidate, HumanStatus } from "@/lib/recruiter-data";
import ScoreBadge from "@/components/recruiter/ScoreBadge";

export default function ApprovalCard({
  candidate,
  onUpdate,
}: {
  candidate: Candidate;
  onUpdate: (status: HumanStatus) => void;
}) {
  const done = candidate.humanStatus !== "Pending approval";
  return (
    <article className="rounded-xl border border-slate-100 p-4 transition hover:border-slate-200 hover:bg-slate-50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-800">{candidate.name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {candidate.role} · {candidate.experience}
          </p>
        </div>
        <ScoreBadge score={candidate.aiScore} />
      </div>
      <p className="mt-3 text-xs text-slate-600">{candidate.summary}</p>
      {done ? (
        <p className="mt-4 text-xs font-semibold text-slate-500">Status: {candidate.humanStatus}</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => onUpdate("Approved")}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-2 text-[10px] font-bold text-white transition hover:bg-emerald-700"
          >
            <Check size={13} /> Approve
          </button>
          <button
            onClick={() => onUpdate("Rejected")}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] font-bold text-slate-600 transition hover:bg-slate-100"
          >
            <X size={13} /> Reject
          </button>
          <button
            onClick={() => onUpdate("Interview requested")}
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-2 text-[10px] font-bold text-indigo-700 transition hover:bg-indigo-100"
          >
            <CalendarDays size={13} /> Interview
          </button>
        </div>
      )}
    </article>
  );
}
