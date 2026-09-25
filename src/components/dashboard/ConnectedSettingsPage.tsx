"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardShell";

type WorkspaceResponse = {
  workspace: {
    id: string;
    name: string;
    members: { id: string; role: string; user: { id: string; name: string; email: string } }[];
  };
  role: string;
  user: { id: string; name: string; email: string };
};

export default function ConnectedSettingsPage() {
  const router = useRouter();
  const { notify } = useDashboard();
  const [data, setData] = useState<WorkspaceResponse | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/workspace", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Workspace settings could not be loaded.");
        return result as WorkspaceResponse;
      })
      .then((result) => {
        if (active) {
          setData(result);
          setName(result.workspace.name);
        }
      })
      .catch((error) => {
        if (active) notify(error instanceof Error ? error.message : "Workspace settings could not be loaded.", "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [notify]);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!data || name.trim().length < 2) return;
    setSaving(true);
    try {
      const response = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save workspace settings.");
      setData({ ...data, workspace: { ...data.workspace, name: result.workspace.name } });
      notify("Workspace settings saved.");
      router.refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not save workspace settings.", "error");
    } finally {
      setSaving(false);
    }
  };
  if (loading)
    return (
      <div className="mx-auto max-w-[900px] animate-pulse px-5 py-8 sm:px-8 lg:px-10">
        <div className="h-9 w-52 rounded bg-slate-200" />
        <div className="mt-8 h-52 rounded-2xl bg-white" />
      </div>
    );
  if (!data)
    return (
      <div className="mx-auto max-w-[900px] px-5 py-8 text-sm text-slate-500">
        Workspace settings are unavailable right now.
      </div>
    );
  const canManage = data.role === "Owner" || data.role === "Admin";
  return (
    <div className="mx-auto max-w-[900px] px-5 py-8 sm:px-8 lg:px-10">
      <div>
        <p className="text-sm font-medium text-indigo-600">Workspace</p>
        <h1 className="mt-1 text-3xl font-bold tracking-[-0.045em] text-slate-900 sm:text-[34px]">Settings</h1>
        <p className="mt-2 text-sm text-slate-500">Control your workspace and review its safety boundaries.</p>
      </div>
      <form onSubmit={save} className="mt-8 space-y-7">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-6">
          <p className="text-base font-bold">Workspace profile</p>
          <p className="mt-1 text-xs text-slate-500">The name shown across your workspace.</p>
          <label className="mt-5 block max-w-md text-xs font-semibold text-slate-700">
            Workspace name
            <input
              required
              minLength={2}
              maxLength={120}
              value={name}
              disabled={!canManage}
              onChange={(event) => setName(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm transition outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
            />
          </label>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-indigo-600" />
            <p className="text-base font-bold">Workforce controls</p>
          </div>
          <div className="mt-5 space-y-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Human approval is required</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Candidate and workflow approval gates cannot be bypassed by AI. External actions are not enabled.
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">AI outputs are drafts</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Generated content is saved for review; no email is sent automatically.
              </p>
            </div>
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-6">
          <p className="text-base font-bold">Workspace members</p>
          <p className="mt-1 text-xs text-slate-500">People with access to this workspace.</p>
          <div className="mt-4 divide-y divide-slate-100">
            {data.workspace.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-4 py-3 text-xs">
                <span>
                  <strong className="block text-slate-800">{member.user.name}</strong>
                  <span className="text-slate-500">{member.user.email}</span>
                </span>
                <span className="font-semibold text-indigo-600">{member.role}</span>
              </div>
            ))}
          </div>
        </section>
        {canManage && (
          <button
            type="submit"
            disabled={saving || name.trim().length < 2 || name.trim() === data.workspace.name}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <Check size={16} /> {saving ? "Saving..." : "Save changes"}
          </button>
        )}
      </form>
    </div>
  );
}
