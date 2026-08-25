export type TaskDraft = {
  name: string;
  assignTo: string;
  priority: "Low" | "Medium" | "High";
  description: string;
};

export type WorkspaceSettings = {
  workspaceName: string;
  approvals: boolean;
  summaries: boolean;
};

export const defaultWorkspaceSettings: WorkspaceSettings = {
  workspaceName: "Acme Studio",
  approvals: true,
  summaries: true,
};

export function isWorkspaceSettings(value: unknown): value is WorkspaceSettings {
  if (!value || typeof value !== "object") return false;
  const settings = value as Record<string, unknown>;
  return (
    typeof settings.workspaceName === "string" &&
    typeof settings.approvals === "boolean" &&
    typeof settings.summaries === "boolean"
  );
}
