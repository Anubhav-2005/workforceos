"use client";

import { useMemo } from "react";
import { Plus, Workflow } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import {
  createIdleRuntime,
  createWorkflow,
  initialWorkflows,
  isWorkflowDefinitionList,
  isWorkflowRuntime,
} from "@/services/workflowEngine";
import type { WorkflowDefinition, WorkflowRuntime } from "@/types/workflow";
import WorkflowAnalytics from "./WorkflowAnalytics";
import WorkflowCanvas from "./WorkflowCanvas";
import WorkflowControls from "./WorkflowControls";
import WorkflowLog from "./WorkflowLog";
import WorkflowSidebar from "./WorkflowSidebar";
import { useWorkflowSimulation } from "./WorkflowSimulation";

const workflowsStorageKey = "workforceos-workflows";
const selectedWorkflowStorageKey = "workforceos-selected-workflow";
const runtimeStorageKey = "workforceos-workflow-runtime";

export default function WorkforceEngine() {
  const { notify } = useDashboard();
  const [workflows, setWorkflows, workflowsHydrated] = useLocalStorageState<WorkflowDefinition[]>(
    workflowsStorageKey,
    initialWorkflows,
    { validate: isWorkflowDefinitionList },
  );
  const [selectedId, setSelectedId, selectedHydrated] = useLocalStorageState<string | null>(
    selectedWorkflowStorageKey,
    initialWorkflows[0].id,
    { validate: isNullableString },
  );
  const [runtime, setRuntime, runtimeHydrated] = useLocalStorageState<WorkflowRuntime>(
    runtimeStorageKey,
    createIdleRuntime(),
    { validate: isWorkflowRuntime },
  );
  const selectedWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.id === selectedId) ?? workflows[0] ?? null,
    [selectedId, workflows],
  );
  const simulation = useWorkflowSimulation({ setRuntime, notify });

  const selectWorkflow = (id: string) => {
    setSelectedId(id);
    simulation.reset();
  };

  const createNewWorkflow = (name: string) => {
    const workflow = createWorkflow(name);
    setWorkflows((current) => [...current, workflow]);
    setSelectedId(workflow.id);
    simulation.reset();
    notify(`${workflow.name} created.`);
  };

  const renameWorkflow = (id: string, name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    setWorkflows((current) =>
      current.map((workflow) => (workflow.id === id ? { ...workflow, name: cleanName } : workflow)),
    );
    notify("Workflow name updated.");
  };

  const duplicateWorkflow = (id: string) => {
    const source = workflows.find((workflow) => workflow.id === id);
    if (!source) return;
    const duplicate = createWorkflow(`${source.name} copy`);
    setWorkflows((current) => [...current, duplicate]);
    setSelectedId(duplicate.id);
    simulation.reset();
    notify(`${source.name} duplicated.`);
  };

  const deleteWorkflow = (id: string) => {
    const nextWorkflows = workflows.filter((workflow) => workflow.id !== id);
    setWorkflows(nextWorkflows);
    setSelectedId(nextWorkflows[0]?.id ?? null);
    simulation.reset();
    notify("Workflow deleted.");
  };

  const toggleWorkflow = () => {
    if (!selectedWorkflow) return;
    const enabled = !selectedWorkflow.enabled;
    setWorkflows((current) =>
      current.map((workflow) => (workflow.id === selectedWorkflow.id ? { ...workflow, enabled } : workflow)),
    );
    notify(`${selectedWorkflow.name} ${enabled ? "enabled" : "disabled"}.`);
  };

  const runWorkflow = () => {
    if (!selectedWorkflow?.enabled) {
      notify("Enable this workflow before running it.");
      return;
    }
    simulation.run();
  };

  if (!workflowsHydrated || !selectedHydrated || !runtimeHydrated) {
    return <WorkflowEngineSkeleton />;
  }

  return (
    <div className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8 lg:px-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-indigo-600">Workforce Engine</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.045em] text-slate-900 sm:text-[34px]">
            AI collaboration workflows
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Orchestrate handoffs between AI employees and the people who guide them.
          </p>
        </div>
        <button
          onClick={() => createNewWorkflow("New collaboration workflow")}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
        >
          <Plus size={17} /> Create workflow
        </button>
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        <WorkflowSidebar
          workflows={workflows}
          selectedId={selectedWorkflow?.id ?? null}
          onSelect={selectWorkflow}
          onCreate={createNewWorkflow}
          onRename={renameWorkflow}
          onDuplicate={duplicateWorkflow}
          onDelete={deleteWorkflow}
        />
        {selectedWorkflow ? (
          <div className="min-w-0 space-y-5">
            <WorkflowControls
              workflow={selectedWorkflow}
              phase={runtime.phase}
              onToggle={toggleWorkflow}
              onRun={runWorkflow}
              onReset={simulation.reset}
              onApprove={simulation.approve}
              onReject={simulation.reject}
            />
            <WorkflowCanvas runtime={runtime} />
            <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
              <WorkflowAnalytics runtime={runtime} />
              <WorkflowLog logs={runtime.logs} />
            </div>
          </div>
        ) : (
          <EmptyWorkflowState onCreate={() => createNewWorkflow("New collaboration workflow")} />
        )}
      </div>
    </div>
  );
}

function EmptyWorkflowState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <div>
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
          <Workflow size={20} />
        </span>
        <h2 className="mt-4 text-base font-bold text-slate-900">Build your first collaboration</h2>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-500">
          Create a workflow to connect AI employees, human approvals, and customer-facing actions.
        </p>
        <button
          onClick={onCreate}
          className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white transition hover:bg-indigo-700"
        >
          <Plus size={14} /> Create workflow
        </button>
      </div>
    </section>
  );
}

function WorkflowEngineSkeleton() {
  return (
    <div className="mx-auto max-w-[1480px] animate-pulse px-5 py-8 sm:px-8 lg:px-10">
      <div className="h-4 w-28 rounded bg-slate-200" />
      <div className="mt-3 h-9 w-80 max-w-full rounded bg-slate-200" />
      <div className="mt-2 h-4 w-96 max-w-full rounded bg-slate-100" />
      <div className="mt-8 grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        <div className="h-[480px] rounded-2xl bg-slate-100" />
        <div className="space-y-5">
          <div className="h-24 rounded-2xl bg-slate-100" />
          <div className="h-[300px] rounded-2xl bg-slate-100" />
          <div className="h-48 rounded-2xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}
