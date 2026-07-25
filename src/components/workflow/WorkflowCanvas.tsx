"use client";

import type { WorkflowRuntime } from "@/types/workflow";
import { workflowNodes } from "@/services/workflowEngine";
import WorkflowEdge from "@/components/workflow/WorkflowEdge";
import WorkflowNode from "@/components/workflow/WorkflowNode";

export default function WorkflowCanvas({ runtime }: { runtime: WorkflowRuntime }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
        <div>
          <p className="text-base font-bold">Collaboration canvas</p>
          <p className="mt-1 text-xs text-slate-500">A shared execution path across AI employees and human approval.</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">7 steps</span>
      </div>
      <div className="overflow-x-auto p-5 sm:p-6">
        <div className="flex min-w-max items-center py-3">
          {workflowNodes.map((node, index) => (
            <div key={node.id} className="flex items-center">
              <WorkflowNode node={node} status={runtime.statuses[node.id]} />
              {index < workflowNodes.length - 1 && (
                <WorkflowEdge
                  active={
                    runtime.statuses[node.id] === "Running" ||
                    runtime.statuses[workflowNodes[index + 1].id] === "Running"
                  }
                  complete={runtime.statuses[node.id] === "Completed"}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
