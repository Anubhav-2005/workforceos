import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EmployeeDetailPage from "@/components/dashboard/EmployeeDetailPage";
import RecruiterDashboard from "@/components/recruiter/RecruiterDashboard";
import ConnectedRecruiterDashboard from "@/components/recruiter/ConnectedRecruiterDashboard";
import { getAgent } from "@/lib/dashboard-data";
import { isDatabaseConfigured } from "@/lib/db";
import ConnectedEmployeeDetailPage from "@/components/dashboard/ConnectedEmployeeDetailPage";

type EmployeeRouteProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: EmployeeRouteProps): Promise<Metadata> {
  const { id } = await params;
  if (id === "recruiter") return { title: "AI Recruiter" };
  const agent = getAgent(id);
  return { title: agent ? `${agent.name} — ${agent.role}` : "AI Employee" };
}

export default async function EmployeeRoutePage({ params }: EmployeeRouteProps) {
  const { id } = await params;
  if (id === "recruiter") return isDatabaseConfigured() ? <ConnectedRecruiterDashboard /> : <RecruiterDashboard />;
  if (isDatabaseConfigured()) return <ConnectedEmployeeDetailPage id={id} />;
  const agent = getAgent(id);
  if (!agent) notFound();
  return <EmployeeDetailPage agent={agent} />;
}
