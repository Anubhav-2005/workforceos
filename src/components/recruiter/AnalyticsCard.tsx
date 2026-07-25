import type { ReactNode } from "react";

export default function AnalyticsCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.025)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <span className="text-indigo-600">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-[-0.04em] text-slate-900">{value}</p>
      <p className="mt-2 text-[11px] text-emerald-600">{detail}</p>
    </section>
  );
}
