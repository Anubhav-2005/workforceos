export type ServerWorkflowNode = {
  id: string;
  key: string;
  title: string;
  type: "START" | "AI_EMPLOYEE" | "HUMAN_APPROVAL" | "CONDITION" | "ACTION" | "DELAY" | "END";
  positionX: number;
  positionY: number;
  config: Record<string, unknown> | null;
  employeeId: string | null;
};

export type ServerWorkflow = {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  status: "Draft" | "Active" | "Archived";
  createdAt: string;
  nodes: ServerWorkflowNode[];
  edges: { sourceKey: string; targetKey: string; condition: { value?: boolean } | null }[];
  executions: { id: string; status: string; createdAt: string; startedAt: string | null; completedAt: string | null }[];
};

export type ServerWorkflowRun = {
  id: string;
  workflowId: string;
  status: "Queued" | "Running" | "WaitingForApproval" | "Completed" | "Failed" | "Cancelled";
  currentNodeKey: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  context: Record<string, unknown> | null;
  steps: {
    id: string;
    nodeKey: string;
    status: string;
    error: string | null;
    output: unknown;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
  }[];
  approvals: {
    id: string;
    status: string;
    action: string;
    requestedAt: string;
    decidedAt: string | null;
    reviewerComment: string | null;
  }[];
};
