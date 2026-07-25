import { BarChart3, CheckCircle2, Users } from "lucide-react";
import type { Candidate } from "@/lib/recruiter-data";
import AnalyticsCard from "@/components/recruiter/AnalyticsCard";

export default function AnalyticsTab({
  candidates,
  averageScore,
  approvalRate,
}: {
  candidates: Candidate[];
  averageScore: number;
  approvalRate: number;
}) {
  return (
    <section>
      <div>
        <p className="text-base font-bold">Recruiter analytics</p>
        <p className="mt-1 text-xs text-slate-500">A live view of recruiter throughput and decision quality.</p>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnalyticsCard
          label="Candidates processed"
          value={String(candidates.length * 14)}
          detail="↑ 18% this week"
          icon={<Users size={17} />}
        />
        <AnalyticsCard
          label="Average score"
          value={`${averageScore}%`}
          detail="↑ 4.2 points this week"
          icon={<BarChart3 size={17} />}
        />
        <AnalyticsCard
          label="Approval rate"
          value={`${approvalRate}%`}
          detail="Based on current pipeline"
          icon={<CheckCircle2 size={17} />}
        />
      </div>
      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-6">
        <p className="text-base font-bold">Hiring funnel</p>
        <p className="mt-1 text-xs text-slate-500">Candidates moving from review to interview.</p>
        <div className="mt-7 space-y-4">
          {[
            ["Resumes received", 120, "bg-indigo-200"],
            ["AI reviewed", 94, "bg-indigo-300"],
            ["Human approved", 48, "bg-indigo-500"],
            ["Interviews scheduled", 21, "bg-indigo-700"],
          ].map(([label, value, color]) => (
            <div key={label as string}>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="font-semibold text-slate-700">{label}</span>
                <span className="text-slate-400">{value}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div style={{ width: `${Number(value) / 1.2}%` }} className={`h-full rounded-full ${color}`} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
