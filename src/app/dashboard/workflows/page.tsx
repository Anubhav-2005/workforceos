import type { Metadata } from "next";
import WorkflowsPage from "@/components/dashboard/WorkflowsPage";

export const metadata: Metadata = { title: "Workforce Engine" };

export default function WorkflowsRoutePage() {
  return <WorkflowsPage />;
}
