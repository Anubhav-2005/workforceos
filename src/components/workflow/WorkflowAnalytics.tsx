"use client";

import { Activity, CheckCircle2, Clock3, ShieldCheck, TriangleAlert } from "lucide-react";
import type { WorkflowRuntime } from "@/types/workflow";

type WorkflowAnalyticsProps = {
  runtime: WorkflowRuntime;
};

const analyticsMeta = [
  {
    label: "Average execution time",
    value: "3m 12s",
    icon: Clock3,
    color: "text-indigo-600",
    background: "bg-indigo-50",
  },
  {
    label: "Completed workflows",
    value: "18",
    icon: CheckCircle2,
    color: "text-emerald-600",
    background: "bg-emerald-50",
  },
  { label: "Failed workflows", value: "0", icon: TriangleAlert, color: "text-rose-600", background: "bg-rose-50" },
  { label: "AI utilization", value: "86%", icon: Activity, color: "text-violet-600", background: "bg-violet-50" },
  { label: "Human approvals", value: "12", icon: ShieldCheck, color: "text-amber-600", background: "bg-amber-50" },
] as const;

export default function WorkflowAnalytics({ runtime }: WorkflowAnalyticsProps) {
  const values = analyticsMeta.map((metric) => {
    if (metric.label === "Completed workflows" && runtime.phase === "completed") return { ...metric, value: "19" };
    if (metric.label === "Failed workflows" && runtime.phase === "failed") return { ...metric, value: "1" };
    if (metric.label === "Human approvals" && runtime.phase === "completed") return { ...metric, value: "13" };
    return metric;
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Workflow analytics</h2>
          <p className="mt-1 text-[11px] text-slate-500">Live automation health across your workforce.</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Healthy</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {values.map(({ label, value, icon: Icon, color, background }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-100 p-3 transition hover:-translate-y-0.5 hover:border-slate-200"
          >
            <span className={`grid h-7 w-7 place-items-center rounded-lg ${background} ${color}`}>
              <Icon size={14} />
            </span>
            <p className="mt-3 text-lg font-bold tracking-[-0.04em] text-slate-900">{value}</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
