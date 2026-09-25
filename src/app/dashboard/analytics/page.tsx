import type { Metadata } from "next";
import AnalyticsPage from "@/components/dashboard/AnalyticsPage";
import ConnectedAnalyticsPage from "@/components/dashboard/ConnectedAnalyticsPage";
import { isDatabaseConfigured } from "@/lib/db";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsRoutePage() {
  return isDatabaseConfigured() ? <ConnectedAnalyticsPage /> : <AnalyticsPage />;
}
