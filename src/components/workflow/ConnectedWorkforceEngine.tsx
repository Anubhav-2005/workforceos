"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Clock3, Play, ShieldCheck, TriangleAlert, Workflow } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import type { WorkflowDefinition, WorkflowLogEntry, WorkflowPhase } from "@/types/workflow";
import ConnectedWorkflowCanvas from "@/components/workflow/ConnectedWorkflowCanvas";
import ConnectedWorkflowEditor from "@/components/workflow/ConnectedWorkflowEditor";
import type { ServerWorkflow, ServerWorkflowRun } from "@/components/workflow/server-types";
import WorkflowControls from "@/components/workflow/WorkflowControls";
import WorkflowLog from "@/components/workflow/WorkflowLog";
import WorkflowSidebar from "@/components/workflow/WorkflowSidebar";

type CandidateOption = { id: string; name: string; analyses: unknown[] };

export default function ConnectedWorkforceEngine() {
  const { notify, workspaceRole } = useDashboard();
  const canManage = ["Owner", "Admin", "Manager"].includes(workspaceRole ?? "");
  const [workflows, setWorkflows] = useState<ServerWorkflow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [run, setRun] = useState<ServerWorkflowRun | null>(null);
  const [history, setHistory] = useState<ServerWorkflowRun[]>([]);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string; role: string }[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [candidateId, setCandidateId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const runVersion = useRef(0);

  const selected = useMemo(
    () => workflows.find((item) => item.id === selectedId) ?? workflows[0] ?? null,
    [workflows, selectedId],
  );
  const sidebarWorkflows: WorkflowDefinition[] = workflows.map((item) => ({
    id: item.id,
    name: item.name,
    enabled: item.enabled,
    createdAt: item.createdAt,
  }));

  const load = useCallback(async () => {
    try {
      const [workflowResponse, candidateResponse, employeeResponse] = await Promise.all([
        fetch("/api/workflows", { cache: "no-store" }),
        fetch("/api/candidates?limit=50", { cache: "no-store" }),
        fetch("/api/employees", { cache: "no-store" }),
      ]);
      const workflowPayload: unknown = await workflowResponse.json();
      const candidatePayload: unknown = await candidateResponse.json();
      if (!workflowResponse.ok || !isObject(workflowPayload) || !Array.isArray(workflowPayload.workflows)) {
        throw new Error(getError(workflowPayload, "Could not load workflows."));
      }
      setWorkflows(workflowPayload.workflows as ServerWorkflow[]);
      if (candidateResponse.ok && isObject(candidatePayload) && Array.isArray(candidatePayload.candidates)) {
        const options = candidatePayload.candidates
          .filter(isCandidateOption)
          .filter((item) => item.analyses.length > 0);
        setCandidates(options);
        setCandidateId((current) => current || options[0]?.id || "");
      }
      if (employeeResponse.ok) {
        const employeePayload: unknown = await employeeResponse.json();
        if (isObject(employeePayload) && Array.isArray(employeePayload.employees)) {
          setEmployees(employeePayload.employees.filter(isEmployeeOption));
        }
      }
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load workflows.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const loadSelected = useCallback(
    async (workflow: ServerWorkflow | null) => {
      if (!workflow) {
        setRun(null);
        setHistory([]);
        return;
      }
      try {
        const response = await fetch(`/api/workflows/${workflow.id}`, { cache: "no-store" });
        const payload: unknown = await response.json();
        if (!response.ok || !isObject(payload) || !isObject(payload.workflow))
          throw new Error(getError(payload, "Could not load run history."));
        const records = Array.isArray(payload.workflow.executions)
          ? (payload.workflow.executions as ServerWorkflowRun[])
          : [];
        setHistory(records);
        const latest = records[0];
        if (!latest) {
          setRun(null);
          return;
        }
        const runResponse = await fetch(`/api/workflows/executions/${latest.id}`, { cache: "no-store" });
        const runPayload: unknown = await runResponse.json();
        if (runResponse.ok && isObject(runPayload) && isObject(runPayload.execution)) {
          setRun(runPayload.execution as ServerWorkflowRun);
        }
      } catch (cause) {
        notify(cause instanceof Error ? cause.message : "Could not load run history.", "error");
      }
    },
    [notify],
  );

  useEffect(() => {
    queueMicrotask(() => {
      void loadSelected(selected);
    });
  }, [loadSelected, selected]);

  const refresh = async (selectedWorkflowId?: string) => {
    await load();
    if (selectedWorkflowId) setSelectedId(selectedWorkflowId);
  };

  const advance = async (executionId: string, version: number) => {
    for (let step = 0; step < 40 && runVersion.current === version; step += 1) {
      const response = await fetch(`/api/workflows/executions/${executionId}/advance`, { method: "POST" });
      const payload: unknown = await response.json();
      if (!response.ok || !isObject(payload) || !isObject(payload.execution)) {
        throw new Error(getError(payload, "The workflow could not advance."));
      }
      const current = payload.execution as ServerWorkflowRun;
      setRun(current);
      if (current.status !== "Queued") {
        if (current.status === "Failed") notify(current.error ?? "The workflow failed.", "error");
        if (current.status === "Completed") notify("Workflow completed. The draft is saved for review.");
        return;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 450));
    }
  };

  const runWorkflow = async () => {
    if (!selected || busy) return;
    if (selected.nodes.some((node) => node.config?.mode === "use_existing_analysis") && !candidateId) {
      notify("Analyze a candidate before running this workflow.", "error");
      return;
    }
    setBusy(true);
    const version = ++runVersion.current;
    try {
      const response = await fetch(`/api/workflows/${selected.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(candidateId ? { candidateId } : {}),
      });
      const payload: unknown = await response.json();
      if (!response.ok || !isObject(payload) || !isObject(payload.execution)) {
        throw new Error(getError(payload, "Could not start this workflow."));
      }
      const execution = payload.execution as ServerWorkflowRun;
      setRun({ ...execution, steps: [], approvals: [] });
      await advance(execution.id, version);
      await loadSelected(selected);
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : "Could not run workflow.", "error");
    } finally {
      setBusy(false);
    }
  };

  const continueRun = async () => {
    if (!run || run.status !== "Queued" || busy) return;
    setBusy(true);
    const version = ++runVersion.current;
    try {
      await advance(run.id, version);
      await loadSelected(selected);
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : "Could not continue this run.", "error");
    } finally {
      setBusy(false);
    }
  };

  const decide = async (decision: "approve" | "reject") => {
    const approval = run?.approvals.find((item) => item.status === "Pending");
    if (!approval || !run || busy) return;
    setBusy(true);
    const version = ++runVersion.current;
    try {
      const response = await fetch(`/api/approvals/${approval.id}/${decision}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(getError(payload, "Could not record this decision."));
      if (decision === "approve") await advance(run.id, version);
      else notify("Workflow stopped after human rejection.", "info");
      await loadSelected(selected);
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : "Could not record this decision.", "error");
    } finally {
      setBusy(false);
    }
  };

  const createWorkflow = async (name: string) => {
    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload: unknown = await response.json();
      if (!response.ok || !isObject(payload) || !isObject(payload.workflow))
        throw new Error(getError(payload, "Could not create workflow."));
      await refresh(String(payload.workflow.id));
      setEditorOpen(true);
      notify("Draft workflow created.");
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : "Could not create workflow.", "error");
    }
  };

  const patchWorkflow = async (id: string, patch: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(getError(payload, "Could not update workflow."));
      await refresh(id);
      notify("Workflow updated.");
      return true;
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : "Could not update workflow.", "error");
      return false;
    }
  };

  const duplicateWorkflow = async (id: string) => {
    const source = workflows.find((item) => item.id === id);
    if (!source) return;
    try {
      const createdResponse = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${source.name} copy`, description: source.description ?? "" }),
      });
      const createdPayload: unknown = await createdResponse.json();
      if (!createdResponse.ok || !isObject(createdPayload) || !isObject(createdPayload.workflow))
        throw new Error(getError(createdPayload, "Could not duplicate workflow."));
      const copyId = String(createdPayload.workflow.id);
      const response = await fetch(`/api/workflows/${copyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          graph: {
            nodes: source.nodes.map((node) => ({
              key: node.key,
              type: node.type,
              title: node.title,
              positionX: node.positionX,
              positionY: node.positionY,
              employeeId: node.employeeId,
              config: node.config ?? {},
            })),
            edges: source.edges.map((edge) => ({
              sourceKey: edge.sourceKey,
              targetKey: edge.targetKey,
              condition: edge.condition?.value ?? null,
            })),
          },
        }),
      });
      if (!response.ok) {
        const payload: unknown = await response.json();
        throw new Error(getError(payload, "Could not copy workflow nodes."));
      }
      await refresh(copyId);
      notify("Workflow duplicated as a draft.");
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : "Could not duplicate workflow.", "error");
    }
  };

  const archiveWorkflow = async (id: string) => {
    try {
      const response = await fetch(`/api/workflows/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload: unknown = await response.json();
        throw new Error(getError(payload, "Could not archive workflow."));
      }
      setSelectedId(null);
      setRun(null);
      await refresh();
      notify("Workflow archived. Its execution history is retained.");
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : "Could not archive workflow.", "error");
    }
  };

  const phase: WorkflowPhase = !run
    ? "idle"
    : run.status === "WaitingForApproval"
      ? "awaiting_approval"
      : run.status === "Queued" || run.status === "Running"
        ? "running"
        : run.status === "Completed"
          ? "completed"
          : "failed";
  const logs = useMemo(() => toLogs(run, selected), [run, selected]);
  const currentHistory = history.filter((item) => item.workflowId === selected?.id);
  const completed = currentHistory.filter((item) => item.status === "Completed").length;
  const failed = currentHistory.filter((item) => item.status === "Failed").length;
  const averageMs = currentHistory
    .filter((item) => item.startedAt && item.completedAt)
    .map((item) => new Date(item.completedAt!).getTime() - new Date(item.startedAt!).getTime());
  const averageSeconds = averageMs.length
    ? Math.round(averageMs.reduce((sum, value) => sum + value, 0) / averageMs.length / 1_000)
    : 0;

  if (loading)
    return (
      <div className="mx-auto max-w-[1480px] animate-pulse px-5 py-8 sm:px-8 lg:px-10">
        <div className="h-8 w-72 rounded bg-slate-200" />
        <div className="mt-8 h-96 rounded-2xl bg-white" />
      </div>
    );

  return (
    <div className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8 lg:px-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-indigo-600">Workforce Engine</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.045em] text-slate-900 sm:text-[34px]">
            AI collaboration workflows
          </h1>
          <p className="mt-2 text-sm text-slate-500">Persisted steps, visible handoffs, and human decisions.</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => void createWorkflow("New collaboration workflow")}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Workflow size={17} /> Create workflow
          </button>
        )}
      </div>
      {error && (
        <div
          role="alert"
          className="mt-6 flex justify-between rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
        >
          <span>{error}</span>
          <button type="button" onClick={() => void load()} className="font-bold underline">
            Retry
          </button>
        </div>
      )}
      <div className="mt-8 grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        <WorkflowSidebar
          workflows={sidebarWorkflows}
          selectedId={selected?.id ?? null}
          connected
          canManage={canManage}
          onSelect={(id) => {
            runVersion.current += 1;
            setSelectedId(id);
            setRun(null);
          }}
          onCreate={(name) => void createWorkflow(name)}
          onRename={(id, name) => void patchWorkflow(id, { name })}
          onDuplicate={(id) => void duplicateWorkflow(id)}
          onDelete={(id) => void archiveWorkflow(id)}
        />
        {selected ? (
          <div className="min-w-0 space-y-5" aria-busy={busy}>
            {selected.nodes.some((node) => node.config?.mode === "use_existing_analysis") && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <label className="block text-xs font-semibold text-slate-700">
                  Candidate for this run
                  <select
                    value={candidateId}
                    onChange={(event) => setCandidateId(event.target.value)}
                    className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm sm:max-w-sm"
                  >
                    <option value="">Select an analyzed candidate</option>
                    {candidates.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.name}
                      </option>
                    ))}
                  </select>
                </label>
                {!candidates.length && (
                  <p className="mt-2 text-xs text-slate-500">
                    No analyzed candidates yet.{" "}
                    <Link href="/dashboard/employees/recruiter" className="font-semibold text-indigo-600">
                      Review a resume
                    </Link>{" "}
                    first.
                  </p>
                )}
              </div>
            )}
            <WorkflowControls
              workflow={{
                id: selected.id,
                name: selected.name,
                enabled: selected.enabled,
                createdAt: selected.createdAt,
              }}
              phase={phase}
              connected
              canManage={canManage}
              busy={busy}
              resumeQueued={run?.status === "Queued"}
              approvalMessage="Execution is paused on a persisted approval record. A reviewer must decide before it can continue."
              onToggle={() => void patchWorkflow(selected.id, { enabled: !selected.enabled })}
              onRun={() => void (run?.status === "Queued" ? continueRun() : runWorkflow())}
              onApprove={() => void decide("approve")}
              onReject={() => void decide("reject")}
              onReset={() => {
                runVersion.current += 1;
                setRun(null);
              }}
            />
            <ConnectedWorkflowCanvas
              workflow={selected}
              run={run}
              onEdit={canManage ? () => setEditorOpen(true) : undefined}
            />
            {run?.error && (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {run.error}
              </p>
            )}
            <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-bold">Run history</h2>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <Stat icon={<Play size={15} />} label="Runs" value={String(currentHistory.length)} />
                  <Stat icon={<ShieldCheck size={15} />} label="Completed" value={String(completed)} />
                  <Stat icon={<TriangleAlert size={15} />} label="Failed" value={String(failed)} />
                </div>
                <p className="mt-4 flex items-center gap-1 text-xs text-slate-500">
                  <Clock3 size={13} /> Average completed duration:{" "}
                  {averageSeconds ? `${averageSeconds}s` : "No completed runs yet"}
                </p>
                <div className="mt-4 space-y-2">
                  {currentHistory.slice(0, 6).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={async () => {
                        const response = await fetch(`/api/workflows/executions/${item.id}`);
                        const payload: unknown = await response.json();
                        if (response.ok && isObject(payload) && isObject(payload.execution))
                          setRun(payload.execution as ServerWorkflowRun);
                      }}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-left text-xs hover:bg-slate-50"
                    >
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                      <span className="font-semibold">{item.status}</span>
                    </button>
                  ))}
                  {!currentHistory.length && (
                    <p className="text-xs text-slate-500">No runs yet. Select a candidate and start one.</p>
                  )}
                </div>
              </section>
              <WorkflowLog logs={logs} />
            </div>
          </div>
        ) : (
          <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-slate-200 bg-white text-center text-sm text-slate-500">
            Create a workflow to get started.
          </div>
        )}
      </div>
      {editorOpen && selected && (
        <ConnectedWorkflowEditor
          key={selected.id}
          workflow={selected}
          employees={employees}
          onClose={() => setEditorOpen(false)}
          onSave={(graph) => patchWorkflow(selected.id, { graph })}
        />
      )}
    </div>
  );
}

function isEmployeeOption(value: unknown): value is { id: string; name: string; role: string } {
  return (
    isObject(value) && typeof value.id === "string" && typeof value.name === "string" && typeof value.role === "string"
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <span className="text-indigo-600">{icon}</span>
      <p className="mt-2 text-xl font-bold">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

function toLogs(run: ServerWorkflowRun | null, workflow: ServerWorkflow | null): WorkflowLogEntry[] {
  if (!run) return [];
  return run.steps.map((step) => ({
    id: step.id,
    time: new Date(step.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    message: `${workflow?.nodes.find((node) => node.key === step.nodeKey)?.title ?? step.nodeKey}: ${step.error ?? step.status}`,
    tone: step.status === "Failed" ? "danger" : step.status === "Waiting" ? "warning" : "success",
  }));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function isCandidateOption(value: unknown): value is CandidateOption {
  return (
    isObject(value) && typeof value.id === "string" && typeof value.name === "string" && Array.isArray(value.analyses)
  );
}
function getError(value: unknown, fallback: string): string {
  return isObject(value) && typeof value.error === "string" ? value.error : fallback;
}
