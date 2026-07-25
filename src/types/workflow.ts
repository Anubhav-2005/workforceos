export const workflowNodeIds = ["resume", "recruiter", "approval", "sales", "email", "support", "complete"] as const;

export type WorkflowNodeId = (typeof workflowNodeIds)[number];
export type WorkflowNodeStatus = "Running" | "Waiting" | "Completed" | "Failed" | "Idle";
export type WorkflowPhase = "idle" | "running" | "awaiting_approval" | "completed" | "failed";

export type WorkflowDefinition = {
  id: string;
  name: string;
  enabled: boolean;
  createdAt: string;
};

export type WorkflowRuntime = {
  phase: WorkflowPhase;
  statuses: Record<WorkflowNodeId, WorkflowNodeStatus>;
  logs: WorkflowLogEntry[];
};

export type WorkflowLogEntry = {
  id: string;
  time: string;
  message: string;
  tone: "default" | "success" | "warning" | "danger";
};

export type WorkflowNodeDefinition = {
  id: WorkflowNodeId;
  title: string;
  subtitle: string;
  kind: "event" | "employee" | "approval" | "action" | "complete";
};
