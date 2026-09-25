import type { Metadata } from "next";
import EmployeesPage from "@/components/dashboard/EmployeesPage";
import ConnectedEmployeesPage from "@/components/dashboard/ConnectedEmployeesPage";
import { isDatabaseConfigured } from "@/lib/db";

export const metadata: Metadata = { title: "AI Employees" };

export default function EmployeesRoutePage() {
  return isDatabaseConfigured() ? <ConnectedEmployeesPage /> : <EmployeesPage />;
}
