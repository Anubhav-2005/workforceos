import type { Metadata } from "next";
import WorkflowsPage from "@/components/dashboard/WorkflowsPage";
import ConnectedWorkforceEngine from "@/components/workflow/ConnectedWorkforceEngine";
import { isDatabaseConfigured } from "@/lib/db";

export const metadata: Metadata = { title: "Workforce Engine" };

export default function WorkflowsRoutePage() {
  return isDatabaseConfigured() ? <ConnectedWorkforceEngine /> : <WorkflowsPage />;
}
