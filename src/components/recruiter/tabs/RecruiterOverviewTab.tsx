import { CheckCircle2, Clock3, ListChecks, Plus } from "lucide-react";
import type { Candidate } from "@/lib/recruiter-data";

type RecruiterOverviewTabProps = {
  candidates: Candidate[];
  pendingCount: number;
  averageScore: number;
  onOpenCandidate: (candidate: Candidate) => void;
  onOpenApprovals: () => void;
  onCreateTask: () => void;
};

export default function RecruiterOverviewTab({
  candidates,
  pendingCount,
  averageScore,
  onOpenCandidate,
  onOpenApprovals,
  onCreateTask,
}: RecruiterOverviewTabProps) {
  const processingCandidates = candidates.filter((candidate) => candidate.resumeStatus === "Processing");

  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.85fr)]">
      <div className="space-y-7">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold">Current tasks</p>
              <p className="mt-1 text-xs text-slate-500">What the Recruiter is working through right now.</p>
            </div>
            <button
              type="button"
              onClick={onCreateTask}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <Plus size={14} /> Add task
            </button>
          </div>
          <div className="mt-5 space-y-3">
            <TaskRow
              title="Screen senior product designer applications"
              detail="18 of 24 resumes reviewed"
              value={75}
            />
            <TaskRow
              title="Prepare interview-ready shortlist"
              detail="6 candidates waiting for your decision"
              value={68}
            />
            <TaskRow title="Validate role skill requirements" detail="Job brief updated 22 minutes ago" value={92} />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-6">
          <div>
            <p className="text-base font-bold">Recent activity</p>
            <p className="mt-1 text-xs text-slate-500">Latest actions completed by the Recruiter.</p>
          </div>
          <div className="mt-5 divide-y divide-slate-100">
            {[
              "Matched Ava Patel to the Product Designer role",
              "Flagged 3 resumes for a human review",
              "Prepared interview notes for Sana Rahman",
            ].map((activity, index) => (
              <div key={activity} className="flex items-center gap-3 py-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-600">
                  <CheckCircle2 size={15} />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-700">{activity}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{["8 min ago", "24 min ago", "1 hr ago"][index]}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-7">
        <section className="rounded-2xl bg-[#171b31] p-5 text-white shadow-xl shadow-slate-200">
          <p className="text-sm font-medium text-slate-300">Today&apos;s productivity</p>
          <p className="mt-2 text-3xl font-bold tracking-[-0.05em]">
            42<span className="text-base text-slate-400"> tasks</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">18 resumes reviewed · 6 decisions prepared</p>
          <div className="mt-6 flex h-16 items-end gap-2">
            {[44, 62, 54, 76, 68, 84, 92].map((height, index) => (
              <div key={height} className="flex-1">
                <div
                  style={{ height: `${height}%` }}
                  className={`min-h-2 rounded-t-md ${index === 6 ? "bg-violet-400" : "bg-white/15"}`}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold">Pending approvals</p>
              <p className="mt-1 text-xs text-slate-500">Candidates requiring your decision.</p>
            </div>
            <button
              type="button"
              onClick={onOpenApprovals}
              className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700"
            >
              {pendingCount} open
            </button>
          </div>
          <button
            type="button"
            onClick={onOpenApprovals}
            className="mt-5 flex w-full items-center justify-between rounded-xl bg-amber-50 p-3 text-left transition hover:bg-amber-100"
          >
            <span>
              <span className="block text-xs font-bold text-slate-800">Review candidate shortlist</span>
              <span className="mt-1 block text-[10px] text-slate-500">Average AI score: {averageScore}%</span>
            </span>
            <span className="text-xs font-bold text-amber-700">Open</span>
          </button>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
          <p className="text-base font-bold">Processing queue</p>
          <div className="mt-4 space-y-3">
            {processingCandidates.length ? (
              processingCandidates.map((candidate) => (
                <button
                  type="button"
                  key={candidate.id}
                  onClick={() => onOpenCandidate(candidate)}
                  className="flex w-full items-center justify-between rounded-xl bg-slate-50 p-3 text-left transition hover:bg-slate-100"
                >
                  <span>
                    <span className="block text-xs font-bold text-slate-700">{candidate.name}</span>
                    <span className="mt-1 block text-[10px] text-slate-500">Resume extraction in progress</span>
                  </span>
                  <Clock3 size={15} className="text-slate-400" />
                </button>
              ))
            ) : (
              <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">The processing queue is clear.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function TaskRow({ title, detail, value }: { title: string; detail: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <ListChecks size={17} className="text-indigo-500" />
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-indigo-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
