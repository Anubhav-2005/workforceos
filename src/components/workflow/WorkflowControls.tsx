"use client";

import { Check, Play, RotateCcw, X } from "lucide-react";
import type { WorkflowDefinition, WorkflowPhase } from "@/types/workflow";

type WorkflowControlsProps = {
  workflow: WorkflowDefinition | null;
  phase: WorkflowPhase;
  onToggle: () => void;
  onRun: () => void;
  onApprove: () => void;
  onReject: () => void;
  onReset: () => void;
};

export default function WorkflowControls({
  workflow,
  phase,
  onToggle,
  onRun,
  onApprove,
  onReject,
  onReset,
}: WorkflowControlsProps) {
  if (!workflow) return null;
  const running = phase === "running";
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-bold">{workflow.name}</p>
          <p className="mt-1 text-xs text-slate-500">Coordinate AI employees with a human decision point.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={workflow.enabled}
            onClick={onToggle}
            className={`relative h-7 w-12 rounded-full transition ${workflow.enabled ? "bg-indigo-600" : "bg-slate-200"}`}
            aria-label={`${workflow.enabled ? "Disable" : "Enable"} ${workflow.name}`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${workflow.enabled ? "left-6" : "left-1"}`}
            />
          </button>
          <span className="text-[10px] font-semibold text-slate-500">{workflow.enabled ? "Enabled" : "Disabled"}</span>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {phase === "awaiting_approval" ? (
          <>
            <button
              type="button"
              onClick={onApprove}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              <Check size={15} /> Approve & resume
            </button>
            <button
              type="button"
              onClick={onReject}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              <X size={15} /> Reject candidate
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onRun}
            disabled={!workflow.enabled || running}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Play size={15} fill="currentColor" /> {running ? "Workflow running" : "Run workflow"}
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <RotateCcw size={14} /> Reset run
        </button>
      </div>
      {phase === "awaiting_approval" && (
        <p role="status" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Candidate scored 92. The workflow is paused until a human approves or rejects the handoff.
        </p>
      )}
    </section>
  );
}
