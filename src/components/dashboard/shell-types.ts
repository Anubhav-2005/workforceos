export type TaskDraft = {
  name: string;
  assignTo: string;
  priority: "Low" | "Medium" | "High";
  description: string;
};
