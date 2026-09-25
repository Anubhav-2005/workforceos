"use client";

import { useCallback, useEffect, useState } from "react";
import { Play, Plus, RotateCcw } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardShell";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignedEmployee: { name: string } | null;
  output: unknown;
  executions: { error: string | null }[];
  createdAt: string;
};

export default function ConnectedTasksPage() {
  const { openTaskModal, notify } = useDashboard();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/tasks", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load tasks.");
      setTasks(data.tasks);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not load tasks.", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);
  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);
  useEffect(() => {
    const onFocus = () => {
      void load();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("workforceos:task-created", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("workforceos:task-created", onFocus);
    };
  }, [load]);

  const run = async (id: string) => {
    setBusyId(id);
    try {
      const response = await fetch(`/api/tasks/${id}/run`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The task could not run.");
      setTasks((current) => current.map((task) => (task.id === id ? data.task : task)));
      setSelectedId(id);
      notify(
        data.task.status === "Completed"
          ? "AI draft is ready for review."
          : data.task.executions?.[0]?.error || "Task needs attention.",
        data.task.status === "Completed" ? "success" : "error",
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : "The task could not run.", "error");
    } finally {
      setBusyId(null);
    }
  };
  const visible = filter === "All" ? tasks : tasks.filter((task) => task.status === filter);
  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 lg:px-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-indigo-600">Work queue</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.045em] text-slate-900 sm:text-[34px]">Tasks</h1>
          <p className="mt-2 text-sm text-slate-500">Assign work, run AI drafts, and inspect the result.</p>
        </div>
        <button
          onClick={() => openTaskModal()}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
        >
          <Plus size={17} /> New work
        </button>
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        {["All", "Queued", "Running", "Completed", "Failed"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${filter === status ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
          >
            {status}
          </button>
        ))}
        <button
          onClick={() => void load()}
          aria-label="Refresh tasks"
          className="rounded-xl border border-slate-200 bg-white px-3 text-slate-600 hover:bg-slate-50"
        >
          <RotateCcw size={14} />
        </button>
      </div>
      {loading ? (
        <div className="mt-5 animate-pulse space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-28 rounded-2xl bg-white" />
          ))}
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {visible.length ? (
            visible.map((task) => (
              <section
                key={task.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)]"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{task.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {task.assignedEmployee?.name || "Unassigned"} · {task.priority} priority · {task.status}
                    </p>
                    {task.description && <p className="mt-3 text-xs leading-5 text-slate-600">{task.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    {["Queued", "Failed"].includes(task.status) && (
                      <button
                        disabled={busyId === task.id}
                        onClick={() => void run(task.id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                      >
                        <Play size={14} />
                        {busyId === task.id ? "Running..." : task.status === "Failed" ? "Retry" : "Run task"}
                      </button>
                    )}
                    {task.output !== null && task.output !== undefined && (
                      <button
                        onClick={() => setSelectedId(selectedId === task.id ? null : task.id)}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        {selectedId === task.id ? "Hide result" : "View result"}
                      </button>
                    )}
                  </div>
                </div>
                {task.executions?.[0]?.error && (
                  <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                    {task.executions[0].error}
                  </p>
                )}
                {selectedId === task.id && task.output !== null && task.output !== undefined && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-700">
                    <p className="mb-2 font-bold">AI draft — review before use</p>
                    <pre className="overflow-x-auto font-sans whitespace-pre-wrap">{formatOutput(task.output)}</pre>
                  </div>
                )}
              </section>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              No {filter === "All" ? "tasks" : filter.toLowerCase() + " tasks"} yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatOutput(value: unknown): string {
  if (!value || typeof value !== "object") return String(value ?? "");
  const record = value as Record<string, unknown>;
  return typeof record.draft === "string" ? record.draft : JSON.stringify(value, null, 2);
}
