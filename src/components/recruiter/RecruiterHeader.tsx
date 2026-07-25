import { Activity, CheckCircle2, ListChecks } from "lucide-react";

export default function RecruiterHeader() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-indigo-600">AI employee</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.045em] text-slate-900">Recruiter</h1>
          <p className="mt-2 text-sm text-slate-500">
            Maya is screening candidates and preparing your hiring decisions.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Working
        </span>
      </div>
      <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
        <HeaderMetric icon={<ListChecks size={17} />} label="Tasks today" value="42" />
        <HeaderMetric icon={<CheckCircle2 size={17} />} label="Accuracy" value="96%" />
        <HeaderMetric icon={<Activity size={17} />} label="Response time" value="2.4 min" />
      </div>
    </section>
  );
}

function HeaderMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-indigo-600 shadow-sm">{icon}</span>
      <div>
        <p className="text-[10px] font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 text-base font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
