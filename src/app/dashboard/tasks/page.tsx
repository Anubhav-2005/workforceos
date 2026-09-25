import { redirect } from "next/navigation";
import ConnectedTasksPage from "@/components/dashboard/ConnectedTasksPage";
import { isDatabaseConfigured } from "@/lib/db";

export const metadata = { title: "Tasks" };
export default function TasksRoutePage() {
  if (!isDatabaseConfigured()) redirect("/dashboard/overview");
  return <ConnectedTasksPage />;
}
