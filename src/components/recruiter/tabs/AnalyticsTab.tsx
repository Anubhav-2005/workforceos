import { BarChart3, CheckCircle2, Users } from "lucide-react";
import type { RecruiterMetrics } from "@/lib/recruiter-data";
import AnalyticsCard from "@/components/recruiter/AnalyticsCard";

export default function AnalyticsTab({ metrics }: { metrics: RecruiterMetrics }) {
  const funnel = [
    { label: "Resumes received", value: metrics.receivedCount, color: "bg-indigo-200" },
    { label: "AI reviews completed", value: metrics.reviewedCount, color: "bg-indigo-300" },
    { label: "Human decisions", value: metrics.decisionedCount, color: "bg-indigo-500" },
    { label: "Advanced by human", value: metrics.advancedCount, color: "bg-indigo-700" },
  ];
  const funnelBase = Math.max(metrics.receivedCount, 1);

  return (
    <section>
      <div>
        <p className="text-base font-bold">Recruiter analytics</p>
        <p className="mt-1 text-xs text-slate-500">A live view of recruiter throughput and decision quality.</p>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnalyticsCard
          label="Candidates processed"
          value={String(metrics.reviewedCount)}
          detail={`${metrics.reviewedCount} of ${metrics.receivedCount} resumes reviewed`}
          icon={<Users size={17} />}
        />
        <AnalyticsCard
          label="Average score"
          value={`${metrics.averageReviewedScore}%`}
          detail={`Across ${metrics.reviewedCount} completed review${metrics.reviewedCount === 1 ? "" : "s"}`}
          icon={<BarChart3 size={17} />}
        />
        <AnalyticsCard
          label="Human approval rate"
          value={`${metrics.approvalRate}%`}
          detail={
            metrics.decisionedCount
              ? `${metrics.approvedCount} approved of ${metrics.decisionedCount} human decision${metrics.decisionedCount === 1 ? "" : "s"}`
              : "No human decisions recorded yet"
          }
          icon={<CheckCircle2 size={17} />}
        />
      </div>
      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-6">
        <p className="text-base font-bold">Hiring funnel</p>
        <p className="mt-1 text-xs text-slate-500">Live stages derived from the current candidate records.</p>
        <div className="mt-7 space-y-4">
          {funnel.map(({ label, value, color }) => (
            <div key={label}>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="font-semibold text-slate-700">{label}</span>
                <span className="text-slate-400">{value}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  style={{ width: `${Math.round((value / funnelBase) * 100)}%` }}
                  className={`h-full rounded-full ${color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
