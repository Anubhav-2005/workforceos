import Link from "next/link";
import { ArrowRight, FileText, ShieldCheck } from "lucide-react";
import type { Candidate } from "@/lib/recruiter-data";
import CandidateCard from "@/components/recruiter/CandidateCard";

export default function ConnectedRecruiterOverview({
  candidates,
  pendingCount,
  onOpenCandidate,
  onOpenApprovals,
  onOpenResumeReview,
}: {
  candidates: Candidate[];
  pendingCount: number;
  onOpenCandidate: (candidate: Candidate) => void;
  onOpenApprovals: () => void;
  onOpenResumeReview: () => void;
}) {
  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.85fr)]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">Recent candidates</h2>
            <p className="mt-1 text-xs text-slate-500">Profiles and evidence saved in this workspace.</p>
          </div>
          <button
            type="button"
            onClick={onOpenResumeReview}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Analyze resume <ArrowRight size={13} className="inline" />
          </button>
        </div>
        {candidates.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {candidates.slice(0, 4).map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} onSelect={() => onOpenCandidate(candidate)} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-7 text-center">
            <FileText size={22} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">No candidates analyzed yet</p>
            <p className="mt-1 text-xs text-slate-500">Upload a PDF to create the first candidate profile.</p>
            <button
              type="button"
              onClick={onOpenResumeReview}
              className="mt-4 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Review a resume
            </button>
          </div>
        )}
      </section>
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-600">
            <ShieldCheck size={18} />
          </span>
          <p className="mt-4 text-2xl font-bold text-slate-900">{pendingCount}</p>
          <p className="mt-1 text-xs text-slate-500">
            Candidate{pendingCount === 1 ? "" : "s"} awaiting a human decision
          </p>
          <button
            type="button"
            onClick={onOpenApprovals}
            className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Open approval queue <ArrowRight size={13} className="inline" />
          </button>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-sm font-bold">Next step</h2>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Approved candidates can be passed into a controlled onboarding workflow. Drafts are saved for review;
            external delivery requires a connected integration.
          </p>
          <Link
            href="/dashboard/workflows"
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View workflows <ArrowRight size={13} />
          </Link>
        </section>
      </div>
    </div>
  );
}
