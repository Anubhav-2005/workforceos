import { CircleDot } from "lucide-react";
import type { WorkflowLogEntry } from "@/types/workflow";

export default function WorkflowLog({ logs }: { logs: WorkflowLogEntry[] }) {
  const toneClasses = {
    default: "text-indigo-500",
    success: "text-emerald-500",
    warning: "text-amber-500",
    danger: "text-rose-500",
  };
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <p className="text-base font-bold">Execution log</p>
        <p className="mt-1 text-xs text-slate-500">A live, auditable history of each collaboration step.</p>
      </div>
      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="max-h-[330px] overflow-y-auto px-5 py-2 sm:px-6"
      >
        {logs.length ? (
          logs.map((log) => (
            <div key={log.id} className="flex gap-3 border-b border-slate-100 py-3 last:border-0">
              <span className={`mt-0.5 ${toneClasses[log.tone]}`}>
                <CircleDot size={14} />
              </span>
              <p className="w-10 shrink-0 text-[10px] font-semibold text-slate-400">{log.time}</p>
              <p className="text-xs leading-5 text-slate-600">{log.message}</p>
            </div>
          ))
        ) : (
          <div className="py-12 text-center">
            <CircleDot className="mx-auto text-slate-300" size={20} />
            <p className="mt-3 text-xs font-semibold text-slate-500">No execution yet</p>
            <p className="mt-1 text-[11px] text-slate-400">Run the workflow to create a live activity trail.</p>
          </div>
        )}
      </div>
    </section>
  );
}
