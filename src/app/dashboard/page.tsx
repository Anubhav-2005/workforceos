import type { Metadata } from "next";
import OverviewPage from "@/components/dashboard/OverviewPage";

export const metadata: Metadata = { title: "Overview" };

export default function DashboardPage() {
  return <OverviewPage />;
}
