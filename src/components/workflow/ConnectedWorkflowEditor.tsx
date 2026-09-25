"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import type { ServerWorkflow, ServerWorkflowNode } from "@/components/workflow/server-types";

type StepType = "AI_EMPLOYEE" | "HUMAN_APPROVAL" | "ACTION" | "DELAY";
type Step = Pick<ServerWorkflowNode, "key" | "title" | "employeeId"> & {
  type: StepType;
  config: Record<string, unknown>;
};
type Graph = {
  nodes: {
    key: string;
    type: ServerWorkflowNode["type"];
    title: string;
    positionX: number;
    positionY: number;
    employeeId: string | null;
    config: Record<string, unknown>;
  }[];
  edges: { sourceKey: string; targetKey: string; condition: null }[];
};

const labels: Record<StepType, string> = {
  AI_EMPLOYEE: "AI employee",
  HUMAN_APPROVAL: "Human approval",
  ACTION: "Save draft",
  DELAY: "Short delay",
};

export default function ConnectedWorkflowEditor({
  workflow,
  employees,
  onClose,
  onSave,
}: {
  workflow: ServerWorkflow;
  employees: { id: string; name: string; role: string }[];
  onClose: () => void;
  onSave: (graph: Graph) => Promise<boolean>;
}) {
  const initial = [...workflow.nodes].sort((a, b) => a.positionX - b.positionX);
  const [steps, setSteps] = useState<Step[]>(
    initial
      .filter(
        (node): node is ServerWorkflowNode & { type: StepType } =>
          node.type !== "START" && node.type !== "END" && node.type !== "CONDITION",
      )
      .map((node) => ({
        key: node.key,
        title: node.title,
        type: node.type,
        employeeId: node.employeeId,
        config: node.config ?? {},
      })),
  );
  const [newType, setNewType] = useState<StepType>("AI_EMPLOYEE");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const firstRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLFormElement>(null);
  const closeRef = useRef(onClose);
  const linear =
    workflow.edges.length === workflow.nodes.length - 1 &&
    !workflow.nodes.some((node) => node.type === "CONDITION") &&
    initial
      .slice(0, -1)
      .every((node, index) =>
        workflow.edges.some(
          (edge) => edge.sourceKey === node.key && edge.targetKey === initial[index + 1]?.key && edge.condition == null,
        ),
      );

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])",
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, []);

  const update = (key: string, patch: Partial<Step>) =>
    setSteps((current) => current.map((step) => (step.key === key ? { ...step, ...patch } : step)));
  const move = (index: number, direction: -1 | 1) =>
    setSteps((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  const add = () => {
    if (steps.length >= 38) {
      setError("A workflow supports at most 40 steps, including Start and Complete.");
      return;
    }
    const key = `step${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
    setSteps((current) => [
      ...current,
      {
        key,
        type: newType,
        title: labels[newType],
        employeeId: newType === "AI_EMPLOYEE" ? (employees[0]?.id ?? null) : null,
        config:
          newType === "ACTION"
            ? { action: "save_draft" }
            : newType === "DELAY"
              ? { seconds: 1 }
              : newType === "HUMAN_APPROVAL"
                ? { action: "Review this handoff" }
                : {},
      },
    ]);
    setError("");
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!linear) return;
    if (steps.some((step) => !step.title.trim() || (step.type === "AI_EMPLOYEE" && !step.employeeId))) {
      setError("Name every step and assign an employee to each AI step.");
      return;
    }
    if (
      steps.some(
        (step, index) =>
          step.type === "ACTION" &&
          !steps
            .slice(0, index)
            .some((previous) => previous.type === "AI_EMPLOYEE" && previous.config.mode !== "use_existing_analysis"),
      )
    ) {
      setError("A Save draft step needs an earlier AI employee draft step.");
      return;
    }
    const start = initial.find((node) => node.type === "START");
    const end = initial.find((node) => node.type === "END");
    if (!start || !end) {
      setError("This workflow needs a Start and Complete step.");
      return;
    }
    const nodes: Graph["nodes"] = [
      {
        key: start.key,
        type: "START",
        title: start.title,
        positionX: 0,
        positionY: 0,
        employeeId: null,
        config: start.config ?? {},
      },
      ...steps.map((step, index) => ({ ...step, positionX: (index + 1) * 220, positionY: 0 })),
      {
        key: end.key,
        type: "END",
        title: end.title,
        positionX: (steps.length + 1) * 220,
        positionY: 0,
        employeeId: null,
        config: end.config ?? {},
      },
    ];
    const edges: Graph["edges"] = nodes
      .slice(0, -1)
      .map((node, index) => ({ sourceKey: node.key, targetKey: nodes[index + 1].key, condition: null }));
    setSaving(true);
    setError("");
    try {
      if (await onSave({ nodes, edges })) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${workflow.name} steps`}
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/25 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        ref={panelRef}
        onSubmit={save}
        className="my-auto w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-[-0.03em]">Edit workflow steps</h2>
            <p className="mt-1 text-xs text-slate-500">
              Build a linear path. Changes apply to new runs; existing run snapshots stay unchanged.
            </p>
          </div>
          <button
            ref={firstRef}
            type="button"
            onClick={onClose}
            aria-label="Close editor"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <X size={17} />
          </button>
        </div>
        {!linear ? (
          <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-4 text-xs text-amber-800">
            This workflow has branches or a custom graph. The linear editor cannot change it; its existing steps remain
            available to run.
          </p>
        ) : (
          <>
            <div className="mt-5 max-h-[52vh] space-y-3 overflow-y-auto pr-1">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-500">
                Start
              </div>
              {steps.map((step, index) => (
                <div key={step.key} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 text-xs font-bold text-indigo-600">
                      {index + 1}. {labels[step.type]}
                    </span>
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      aria-label={`Move ${step.title} up`}
                      className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={index === steps.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label={`Move ${step.title} down`}
                      className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSteps((current) => current.filter((item) => item.key !== step.key))}
                      aria-label={`Remove ${step.title}`}
                      className="rounded p-1 text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <label className="mt-3 block text-[11px] font-semibold text-slate-700">
                    Step title
                    <input
                      required
                      maxLength={160}
                      value={step.title}
                      onChange={(event) => update(step.key, { title: event.target.value })}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
                    />
                  </label>
                  {step.type === "AI_EMPLOYEE" && (
                    <>
                      <label className="mt-3 block text-[11px] font-semibold text-slate-700">
                        Assigned employee
                        <select
                          required
                          value={step.employeeId ?? ""}
                          onChange={(event) => update(step.key, { employeeId: event.target.value || null })}
                          className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs"
                        >
                          <option value="">Select employee</option>
                          {employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {employee.name} — {employee.role}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="mt-3 block text-[11px] font-semibold text-slate-700">
                        Task instructions
                        <input
                          maxLength={1500}
                          value={String(step.config.instructions ?? "")}
                          onChange={(event) =>
                            update(step.key, { config: { ...step.config, instructions: event.target.value } })
                          }
                          placeholder="Describe the draft this employee should prepare"
                          className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
                        />
                      </label>
                      {step.config.mode === "use_existing_analysis" && (
                        <p className="mt-2 text-[10px] text-slate-500">
                          Uses an existing Recruiter analysis rather than making a new AI call.
                        </p>
                      )}
                    </>
                  )}
                  {step.type === "HUMAN_APPROVAL" && (
                    <label className="mt-3 block text-[11px] font-semibold text-slate-700">
                      Approval action
                      <input
                        maxLength={180}
                        value={String(step.config.action ?? "")}
                        onChange={(event) =>
                          update(step.key, { config: { ...step.config, action: event.target.value } })
                        }
                        className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs"
                      />
                    </label>
                  )}
                  {step.type === "DELAY" && (
                    <label className="mt-3 block text-[11px] font-semibold text-slate-700">
                      Delay (0–3 seconds)
                      <input
                        type="number"
                        min={0}
                        max={3}
                        step={0.5}
                        value={Number(step.config.seconds ?? 1)}
                        onChange={(event) => update(step.key, { config: { seconds: Number(event.target.value) } })}
                        className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs"
                      />
                    </label>
                  )}
                  {step.type === "ACTION" && (
                    <p className="mt-2 text-[10px] text-slate-500">
                      Saves the latest AI draft inside WorkforceOS. No email is sent.
                    </p>
                  )}
                </div>
              ))}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-500">
                Complete
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <select
                value={newType}
                onChange={(event) => setNewType(event.target.value as StepType)}
                aria-label="New step type"
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs"
              >
                {Object.entries(labels).map(([type, label]) => (
                  <option key={type} value={type}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={add}
                className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 px-3 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
              >
                <Plus size={14} /> Add step
              </button>
            </div>
          </>
        )}
        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
          >
            Cancel
          </button>
          {linear && (
            <button
              disabled={saving}
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save steps"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
