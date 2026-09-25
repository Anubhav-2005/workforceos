"use client";

import { useEffect, useRef, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { X } from "lucide-react";
import { agents } from "@/lib/dashboard-data";
import type { TaskDraft } from "@/components/dashboard/shell-types";

type TaskModalProps = {
  draft: TaskDraft;
  setDraft: Dispatch<SetStateAction<TaskDraft>>;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  employees?: { id: string; name: string; role: string }[];
};

export default function TaskModal({ draft, setDraft, onClose, onSubmit, employees }: TaskModalProps) {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    nameInputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = formRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!formRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyboard);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyboard);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/25 p-3 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-work-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="my-auto w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p id="new-work-title" className="text-lg font-bold tracking-[-0.03em]">
              Create new work
            </p>
            <p className="mt-1 text-xs text-slate-500">Assign a focused task to an AI employee.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close new work dialog"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block text-xs font-semibold text-slate-700">
            Task name
            <input
              ref={nameInputRef}
              required
              maxLength={120}
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="e.g. Source senior product designers"
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm transition outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-700">
              Assign to
              <select
                value={draft.assignTo}
                onChange={(event) => setDraft((current) => ({ ...current, assignTo: event.target.value }))}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                {(employees ?? agents).map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} — {agent.role}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Priority
              <select
                value={draft.priority}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, priority: event.target.value as TaskDraft["priority"] }))
                }
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
          </div>

          <label className="block text-xs font-semibold text-slate-700">
            Description
            <textarea
              maxLength={1_000}
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              placeholder="Give your AI employee useful context and a clear outcome."
              className="mt-1.5 min-h-28 w-full resize-y rounded-xl border border-slate-200 p-3 text-sm transition outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!draft.name.trim() || (employees !== undefined && employees.length === 0)}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            Create task
          </button>
        </div>
      </form>
    </div>
  );
}
