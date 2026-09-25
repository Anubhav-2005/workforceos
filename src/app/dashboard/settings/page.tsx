import type { Metadata } from "next";
import SettingsPage from "@/components/dashboard/SettingsPage";
import ConnectedSettingsPage from "@/components/dashboard/ConnectedSettingsPage";
import { isDatabaseConfigured } from "@/lib/db";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsRoutePage() {
  return isDatabaseConfigured() ? <ConnectedSettingsPage /> : <SettingsPage />;
}
