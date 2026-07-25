"use client";

import { useState, type FormEvent } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import { useLocalStorageState } from "@/lib/useLocalStorageState";

type WorkspaceSettings = {
  workspaceName: string;
  approvals: boolean;
  summaries: boolean;
};

const defaultSettings: WorkspaceSettings = {
  workspaceName: "Acme Studio",
  approvals: true,
  summaries: true,
};

export default function SettingsPage() {
  const { notify } = useDashboard();
  const [savedSettings, setSavedSettings, hydrated] = useLocalStorageState<WorkspaceSettings>(
    "workforceos-settings",
    defaultSettings,
    { validate: isWorkspaceSettings },
  );
  const [draft, setDraft] = useState<WorkspaceSettings | null>(null);
  const settings = draft ?? savedSettings;
  const validWorkspaceName = settings.workspaceName.trim().length > 1;

  const updateSettings = (next: Partial<WorkspaceSettings>) => {
    setDraft((current) => ({ ...(current ?? savedSettings), ...next }));
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validWorkspaceName) return;

    const nextSettings = { ...settings, workspaceName: settings.workspaceName.trim() };
    setSavedSettings(nextSettings);
    setDraft(null);
    notify(`${nextSettings.workspaceName} settings saved locally.`);
  };

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-[900px] animate-pulse px-5 py-8 sm:px-8 lg:px-10">
        <div className="h-4 w-24 rounded bg-indigo-100" />
        <div className="mt-3 h-9 w-52 rounded bg-slate-200" />
        <div className="mt-8 h-52 rounded-2xl bg-white" />
        <div className="mt-7 h-64 rounded-2xl bg-white" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-5 py-8 sm:px-8 lg:px-10">
      <div>
        <p className="text-sm font-medium text-indigo-600">Workspace</p>
        <h1 className="mt-1 text-3xl font-bold tracking-[-0.045em] text-slate-900 sm:text-[34px]">Settings</h1>
        <p className="mt-2 text-sm text-slate-500">
          Control how your AI workforce reports, routes, and requests approvals.
        </p>
      </div>

      <form onSubmit={save} className="mt-8 space-y-7">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-6">
          <p className="text-base font-bold">Workspace profile</p>
          <p className="mt-1 text-xs text-slate-500">The name shown across your local MVP workspace.</p>
          <label className="mt-5 block max-w-md text-xs font-semibold text-slate-700">
            Workspace name
            <input
              required
              minLength={2}
              maxLength={60}
              value={settings.workspaceName}
              onChange={(event) => updateSettings({ workspaceName: event.target.value })}
              aria-invalid={!validWorkspaceName}
              aria-describedby={!validWorkspaceName ? "workspace-name-error" : undefined}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm transition outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          {!validWorkspaceName && (
            <p id="workspace-name-error" role="alert" className="mt-2 text-xs text-rose-600">
              Enter at least two characters for the workspace name.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-indigo-600" />
            <p className="text-base font-bold">Workforce controls</p>
          </div>
          <div className="mt-5 space-y-4">
            <SettingToggle
              title="Require human approval"
              description="Keep high-impact hiring, pricing, and customer decisions in your review queue."
              enabled={settings.approvals}
              onChange={() => updateSettings({ approvals: !settings.approvals })}
            />
            <SettingToggle
              title="Daily workforce summary"
              description="Prepare a local standup summary of completed and pending work."
              enabled={settings.summaries}
              onChange={() => updateSettings({ summaries: !settings.summaries })}
            />
          </div>
        </section>

        <button
          type="submit"
          disabled={!validWorkspaceName}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          <Check size={16} /> Save changes
        </button>
      </form>
    </div>
  );
}

function SettingToggle({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onChange}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? "bg-indigo-600" : "bg-slate-200"}`}
        aria-label={title}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${enabled ? "left-6" : "left-1"}`}
        />
      </button>
    </div>
  );
}

function isWorkspaceSettings(value: unknown): value is WorkspaceSettings {
  if (!value || typeof value !== "object") return false;
  const settings = value as Record<string, unknown>;
  return (
    typeof settings.workspaceName === "string" &&
    typeof settings.approvals === "boolean" &&
    typeof settings.summaries === "boolean"
  );
}
