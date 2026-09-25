import type { Metadata } from "next";
import OverviewPage from "@/components/dashboard/OverviewPage";
import ConnectedOverviewPage from "@/components/dashboard/ConnectedOverviewPage";
import { isDatabaseConfigured } from "@/lib/db";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewRoutePage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  if (isDatabaseConfigured()) {
    const { search } = await searchParams;
    return <ConnectedOverviewPage search={search} />;
  }
  return <OverviewPage />;
}
