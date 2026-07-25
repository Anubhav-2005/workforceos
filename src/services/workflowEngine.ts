import type {
  WorkflowDefinition,
  WorkflowLogEntry,
  WorkflowNodeDefinition,
  WorkflowNodeId,
  WorkflowRuntime,
} from "@/types/workflow";

export const workflowNodes: WorkflowNodeDefinition[] = [
  { id: "resume", title: "Resume uploaded", subtitle: "Candidate source", kind: "event" },
  { id: "recruiter", title: "Recruiter", subtitle: "AI analysis", kind: "employee" },
  { id: "approval", title: "Human approval", subtitle: "Decision required", kind: "approval" },
  { id: "sales", title: "Sales", subtitle: "Onboarding handoff", kind: "employee" },
  { id: "email", title: "Email", subtitle: "Onboarding email", kind: "action" },
  { id: "support", title: "Customer Support", subtitle: "Welcome package", kind: "employee" },
  { id: "complete", title: "Complete", subtitle: "Workflow closed", kind: "complete" },
];

export const initialWorkflows: WorkflowDefinition[] = [
  { id: "candidate-onboarding", name: "Candidate onboarding", enabled: true, createdAt: "2026-07-25" },
  { id: "priority-follow-up", name: "Priority candidate follow-up", enabled: true, createdAt: "2026-07-25" },
  { id: "welcome-activation", name: "New hire welcome activation", enabled: false, createdAt: "2026-07-25" },
];

export function createIdleRuntime(): WorkflowRuntime {
  return {
    phase: "idle",
    statuses: Object.fromEntries(workflowNodes.map((node) => [node.id, "Idle"])) as WorkflowRuntime["statuses"],
    logs: [],
  };
}

export function createWorkflow(name: string): WorkflowDefinition {
  return {
    id: crypto.randomUUID(),
    name: name.trim() || "Untitled workflow",
    enabled: true,
    createdAt: new Date().toISOString(),
  };
}

export function createLog(message: string, tone: WorkflowLogEntry["tone"] = "default"): WorkflowLogEntry {
  return {
    id: `log-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    time: new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()),
    message,
    tone,
  };
}

export function withNodeStatus(
  runtime: WorkflowRuntime,
  nodeId: WorkflowNodeId,
  status: WorkflowRuntime["statuses"][WorkflowNodeId],
) {
  return { ...runtime, statuses: { ...runtime.statuses, [nodeId]: status } };
}

export function isWorkflowDefinitionList(value: unknown): value is WorkflowDefinition[] {
  return (
    Array.isArray(value) &&
    value.every((workflow) => {
      if (!workflow || typeof workflow !== "object") return false;
      const candidate = workflow as Record<string, unknown>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.enabled === "boolean" &&
        typeof candidate.createdAt === "string"
      );
    })
  );
}

export function isWorkflowRuntime(value: unknown): value is WorkflowRuntime {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  if (!["idle", "running", "awaiting_approval", "completed", "failed"].includes(String(candidate.phase))) return false;
  if (!candidate.statuses || typeof candidate.statuses !== "object" || !Array.isArray(candidate.logs)) return false;

  const statuses = candidate.statuses as Record<string, unknown>;
  return workflowNodes.every((node) =>
    ["Running", "Waiting", "Completed", "Failed", "Idle"].includes(String(statuses[node.id])),
  );
}
