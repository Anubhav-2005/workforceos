import type { Metadata } from "next";
import AnalyticsPage from "@/components/dashboard/AnalyticsPage";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsRoutePage() {
  return <AnalyticsPage />;
}
