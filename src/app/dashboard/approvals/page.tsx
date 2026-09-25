import { redirect } from "next/navigation";
import ConnectedApprovalsPage from "@/components/dashboard/ConnectedApprovalsPage";
import { isDatabaseConfigured } from "@/lib/db";

export const metadata = { title: "Approvals" };
export default function ApprovalsRoutePage() {
  if (!isDatabaseConfigured()) redirect("/dashboard/overview");
  return <ConnectedApprovalsPage />;
}
