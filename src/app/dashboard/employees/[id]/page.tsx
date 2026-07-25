import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EmployeeDetailPage from "@/components/dashboard/EmployeeDetailPage";
import RecruiterDashboard from "@/components/recruiter/RecruiterDashboard";
import { getAgent } from "@/lib/dashboard-data";

type EmployeeRouteProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: EmployeeRouteProps): Promise<Metadata> {
  const { id } = await params;
  if (id === "recruiter") return { title: "AI Recruiter" };
  const agent = getAgent(id);
  return { title: agent ? `${agent.name} — ${agent.role}` : "AI Employee" };
}

export default async function EmployeeRoutePage({ params }: EmployeeRouteProps) {
  const { id } = await params;
  if (id === "recruiter") return <RecruiterDashboard />;
  const agent = getAgent(id);
  if (!agent) notFound();
  return <EmployeeDetailPage agent={agent} />;
}
