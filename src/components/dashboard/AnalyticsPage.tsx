"use client";

import { useState } from "react";
import { Download, TrendingUp } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardShell";

const periods = ["This week", "This month", "This quarter"];

export default function AnalyticsPage() {
  const { notify } = useDashboard();
  const [period, setPeriod] = useState("This week");
  const [exporting, setExporting] = useState(false);
  const metrics =
    period === "This week"
      ? ["72", "24.5 hrs", "86.4%", "94%"]
      : period === "This month"
        ? ["284", "98.0 hrs", "84.8%", "92%"]
        : ["841", "304 hrs", "87.1%", "93%"];
  const exportReport = () => {
    setExporting(true);
    window.setTimeout(() => {
      const report = [
        ["Metric", "Value", "Period"],
        ["Tasks completed", metrics[0], period],
        ["Hours reclaimed", metrics[1], period],
        ["Workflow success", metrics[2], period],
        ["Team satisfaction", metrics[3], period],
      ]
        .map((row) => row.join(","))
        .join("\n");
      const url = URL.createObjectURL(new Blob([report], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `workforceos-${period.toLowerCase().replaceAll(" ", "-")}-report.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setExporting(false);
      notify(`${period} report exported locally.`);
    }, 700);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 lg:px-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-indigo-600">Performance data</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.045em] text-slate-900 sm:text-[34px]">Analytics</h1>
          <p className="mt-2 text-sm text-slate-500">See how your AI workforce creates capacity across the team.</p>
        </div>
        <button
          onClick={exportReport}
          disabled={exporting}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-wait"
        >
          <Download size={16} /> {exporting ? "Preparing report" : "Export report"}
        </button>
      </div>
      <div className="mt-8 flex w-fit rounded-xl border border-slate-200 bg-white p-1">
        {periods.map((item) => (
          <button
            key={item}
            onClick={() => setPeriod(item)}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${period === item ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-slate-800"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Tasks completed", metrics[0]],
          ["Hours reclaimed", metrics[1]],
          ["Workflow success", metrics[2]],
          ["Team satisfaction", metrics[3]],
        ].map(([label, value]) => (
          <section
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.025)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-[-0.04em]">{value}</p>
            <p className="mt-2 text-[11px] font-medium text-emerald-600">↑ 8.2% from prior period</p>
          </section>
        ))}
      </div>
      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-base font-bold">Workforce efficiency</p>
            <p className="mt-1 text-xs text-slate-500">
              The proportion of work completed without needing a human handoff.
            </p>
          </div>
          <p className="text-2xl font-bold tracking-[-0.04em] text-indigo-600">86.4%</p>
        </div>
        <div className="mt-8 flex h-48 items-end gap-3">
          {[42, 56, 48, 70, 62, 79, 88].map((height, index) => (
            <button
              key={height}
              onClick={() =>
                notify(
                  `${["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][index]}: ${height}% efficiency.`,
                )
              }
              style={{ height: `${height}%` }}
              className={`group relative flex-1 rounded-t-lg transition hover:opacity-80 ${index === 6 ? "bg-indigo-600" : "bg-indigo-100"}`}
              aria-label={`View ${height}% efficiency`}
            >
              <span className="absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-[10px] text-white group-hover:block">
                {height}%
              </span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex justify-between px-1 text-[10px] text-slate-400">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </section>
    </div>
  );
}
