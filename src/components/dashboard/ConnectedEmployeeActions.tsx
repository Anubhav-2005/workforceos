"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardShell";

export default function ConnectedEmployeeActions({
  kind,
  employeeId,
  enabled,
}: {
  kind: "assign" | "create" | "toggle";
  employeeId?: string;
  enabled?: boolean;
}) {
  const { openTaskModal, notify } = useDashboard();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  const toggle = async () => {
    if (!employeeId) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled, status: enabled ? "Paused" : "Active" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update employee.");
      notify(enabled ? "AI employee paused." : "AI employee resumed.");
      router.refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not update employee.", "error");
    } finally {
      setBusy(false);
    }
  };

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create employee.");
      setOpen(false);
      setName("");
      setRole("");
      notify(`${name} joined your AI workforce.`);
      router.refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not create employee.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (kind === "toggle")
    return (
      <button
        type="button"
        disabled={busy}
        onClick={toggle}
        className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
      >
        {enabled ? "Pause employee" : "Resume employee"}
      </button>
    );
  if (kind === "assign")
    return (
      <button
        type="button"
        onClick={() => openTaskModal(employeeId ? { assignTo: employeeId } : {})}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
      >
        <Plus size={17} /> Assign work
      </button>
    );
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
      >
        Create employee →
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create AI employee"
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/25 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <form onSubmit={create} className="w-full max-w-md rounded-2xl bg-white p-6 text-left shadow-2xl">
            <h2 className="text-lg font-bold">Create AI employee</h2>
            <p className="mt-1 text-xs text-slate-500">Give this specialist a name and a clear role.</p>
            <label className="mt-5 block text-xs font-semibold">
              Name
              <input
                required
                minLength={2}
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </label>
            <label className="mt-4 block text-xs font-semibold">
              Role
              <input
                required
                minLength={2}
                maxLength={160}
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Creating..." : "Create employee"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
