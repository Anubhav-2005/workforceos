"use client";

import { useEffect, useState } from "react";
import { Download, TrendingUp } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardShell";

type Analytics = {
  days: number;
  dailyCompleted: { label: string; count: number }[];
  metrics: {
    activeEmployees: number;
    tasksCompleted: number;
    workflowRuns: number;
    completedRuns: number;
    failedRuns: number;
    workflowSuccessRate: number;
    approvals: number;
    approvedCount: number;
    approvalResponseMinutes: number | null;
    aiExecutions: number;
    aiSuccessRate: number;
    tokensUsed: number;
  };
};
const periods = [
  [7, "This week"],
  [30, "This month"],
  [90, "This quarter"],
] as const;

export default function ConnectedAnalyticsPage() {
  const { notify } = useDashboard();
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetch(`/api/analytics?days=${days}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Analytics could not be loaded.");
        return result as Analytics;
      })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((error) => {
        if (active) notify(error instanceof Error ? error.message : "Analytics could not be loaded.", "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [days, notify]);
  const metrics = data?.metrics;
  const cards = metrics
    ? [
        ["Tasks completed", String(metrics.tasksCompleted), "Measured completions"],
        [
          "Workflow success",
          `${metrics.workflowSuccessRate}%`,
          `${metrics.completedRuns} of ${metrics.workflowRuns} runs`,
        ],
        ["Human approvals", String(metrics.approvedCount), `${metrics.approvals} decisions`],
        ["AI success", `${metrics.aiSuccessRate}%`, `${metrics.aiExecutions} executions`],
      ]
    : [];
  const exportReport = () => {
    if (!metrics) return;
    const rows = [
      ["Metric", "Value", "Period"],
      ...cards.map(([label, value]) => [label, value, `${days} days`]),
      ["Tokens used", String(metrics.tokensUsed), `${days} days`],
      ["Average approval response (minutes)", String(metrics.approvalResponseMinutes ?? "N/A"), `${days} days`],
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `workforceos-${days}-day-report.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    notify("Report exported locally.");
  };
  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 lg:px-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-indigo-600">Performance data</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.045em] text-slate-900 sm:text-[34px]">Analytics</h1>
          <p className="mt-2 text-sm text-slate-500">See measured outcomes from your AI workforce.</p>
        </div>
        <button
          onClick={exportReport}
          disabled={!metrics}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
        >
          <Download size={16} /> Export report
        </button>
      </div>
      <div className="mt-8 flex w-fit rounded-xl border border-slate-200 bg-white p-1">
        {periods.map(([value, label]) => (
          <button
            key={value}
            onClick={() => {
              setLoading(true);
              setDays(value);
            }}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${days === value ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-slate-800"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="mt-5 grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-36 rounded-2xl bg-white" />
          ))}
        </div>
      ) : metrics ? (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(([label, value, context]) => (
              <section
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.025)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                  <TrendingUp size={16} className="text-indigo-500" />
                </div>
                <p className="mt-3 text-2xl font-bold tracking-[-0.04em]">{value}</p>
                <p className="mt-2 text-[11px] text-slate-500">{context}</p>
              </section>
            ))}
          </div>
          <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-6">
            <p className="text-base font-bold">Tasks completed over time</p>
            <p className="mt-1 text-xs text-slate-500">Actual completed tasks during this period.</p>
            <div className="mt-8 flex h-48 items-end gap-3">
              {data!.dailyCompleted.map((point, index) => (
                <div
                  key={index}
                  className="group relative h-full flex-1"
                  title={`${point.label}: ${point.count} tasks`}
                >
                  <div
                    style={{
                      height: `${Math.max(4, (point.count / Math.max(1, ...data!.dailyCompleted.map((item) => item.count))) * 100)}%`,
                    }}
                    className={`absolute inset-x-0 bottom-0 rounded-t-lg transition hover:opacity-80 ${index === 6 ? "bg-indigo-600" : "bg-indigo-100"}`}
                  />
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] text-slate-500">
                    {point.count}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between px-1 text-[10px] text-slate-400">
              {data!.dailyCompleted.map((point, index) => (
                <span key={index}>{point.label}</span>
              ))}
            </div>
          </section>
          <p className="mt-5 text-xs text-slate-500">
            {metrics.activeEmployees} active AI employees · {metrics.tokensUsed.toLocaleString()} model tokens used ·{" "}
            {metrics.approvalResponseMinutes === null
              ? "No approval timing data yet"
              : `${metrics.approvalResponseMinutes} min average approval response`}
          </p>
        </>
      ) : (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          Analytics are temporarily unavailable.
        </div>
      )}
    </div>
  );
}
