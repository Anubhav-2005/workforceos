import { ArrowRight, Bot, CheckCircle2, Circle, Clock3, FileText, GitBranch, Mail, ShieldCheck } from "lucide-react";
import type { ServerWorkflow, ServerWorkflowRun } from "@/components/workflow/server-types";

const icons = {
  START: FileText,
  AI_EMPLOYEE: Bot,
  HUMAN_APPROVAL: ShieldCheck,
  CONDITION: GitBranch,
  ACTION: Mail,
  DELAY: Clock3,
  END: CheckCircle2,
} as const;

export default function ConnectedWorkflowCanvas({
  workflow,
  run,
}: {
  workflow: ServerWorkflow;
  run: ServerWorkflowRun | null;
}) {
  const sorted = [...workflow.nodes].sort((a, b) => a.positionX - b.positionX);
  const statuses = new Map(run?.steps.map((step) => [step.nodeKey, step.status]) ?? []);
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
        <div>
          <h2 className="text-base font-bold">Execution path</h2>
          <p className="mt-1 text-xs text-slate-500">Every step reflects a persisted server state.</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">
          {sorted.length} steps
        </span>
      </div>
      <div className="overflow-x-auto p-5 sm:p-6">
        <div className="flex min-w-max items-center gap-3 py-2">
          {sorted.map((node, index) => {
            const Icon = icons[node.type] ?? Circle;
            const status = statuses.get(node.key) ?? (run?.currentNodeKey === node.key ? run.status : "Pending");
            const color =
              status === "Completed"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : status === "Running" || status === "Queued"
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : status === "Waiting" || status === "WaitingForApproval"
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : status === "Failed"
                      ? "border-rose-300 bg-rose-50 text-rose-700"
                      : "border-slate-200 bg-white text-slate-500";
            return (
              <div key={node.key} className="flex items-center gap-3">
                <div className={`min-h-28 w-40 rounded-xl border p-3 transition-colors ${color}`}>
                  <Icon size={18} />
                  <p className="mt-3 truncate text-xs font-bold text-slate-800">{node.title}</p>
                  <p className="mt-1 text-[10px] font-semibold">{status}</p>
                </div>
                {index < sorted.length - 1 && (
                  <ArrowRight size={17} className={status === "Completed" ? "text-emerald-500" : "text-slate-300"} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
