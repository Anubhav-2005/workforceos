import type { Metadata } from "next";
import EmployeesPage from "@/components/dashboard/EmployeesPage";

export const metadata: Metadata = { title: "AI Employees" };

export default function EmployeesRoutePage() {
  return <EmployeesPage />;
}
