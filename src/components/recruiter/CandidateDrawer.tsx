"use client";

import { useEffect, useRef } from "react";
import { Trash2, X } from "lucide-react";
import type { Candidate } from "@/lib/recruiter-data";
import AnalysisSourceBadge from "@/components/recruiter/AnalysisSourceBadge";
import ScoreBadge from "@/components/recruiter/ScoreBadge";
import ResumeAnalysis from "@/components/recruiter/ResumeAnalysis";

export default function CandidateDrawer({
  candidate,
  onClose,
  onDelete,
}: {
  candidate: Candidate;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeWithKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeWithKeyboard);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeWithKeyboard);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 p-0 backdrop-blur-[2px] sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="candidate-drawer-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="h-full w-full max-w-[460px] overflow-y-auto bg-white p-5 shadow-2xl shadow-slate-900/20 sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold tracking-[0.14em] text-slate-400 uppercase">Candidate profile</p>
              <AnalysisSourceBadge source={candidate.analysisSource} />
            </div>
            <h2
              id="candidate-drawer-title"
              className="mt-3 truncate text-2xl font-bold tracking-[-0.04em] text-slate-900"
            >
              {candidate.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {candidate.role} · {candidate.experience}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close candidate profile"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 p-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Resume status</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{candidate.resumeStatus}</p>
          </div>
          <ScoreBadge score={candidate.aiScore} />
        </div>

        <div className="mt-6">
          <p className="text-sm font-bold text-slate-900">Skills</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {candidate.skills.map((skill) => (
              <span key={skill} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-100 p-4">
          <p className="text-sm font-bold text-slate-800">Recruiter summary</p>
          <p className="mt-2 text-xs leading-5 text-slate-600">{candidate.summary}</p>
          <p className="mt-3 text-[11px] font-semibold text-slate-500">Human status: {candidate.humanStatus}</p>
        </div>

        {candidate.analysis && (
          <div className="mt-6">
            <ResumeAnalysis analysis={candidate.analysis} source={candidate.analysisSource ?? "openai"} />
          </div>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="mt-7 inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
          >
            <Trash2 size={14} /> Delete candidate data
          </button>
        )}
      </aside>
    </div>
  );
}
