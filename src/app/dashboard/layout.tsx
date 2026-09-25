import DashboardShell from "@/components/dashboard/DashboardShell";
import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db";
import { getPrisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const demo = !isDatabaseConfigured();
  const context = demo ? null : await getWorkspaceContext();
  if (!demo && !context) redirect("/sign-in");
  const employees = context
    ? await getPrisma().aIEmployee.findMany({
        where: { organizationId: context.organization.id, enabled: true, status: "Active" },
        select: { id: true, name: true, role: true },
        orderBy: { createdAt: "asc" },
      })
    : [];
  return (
    <>
      {demo && (
        <div className="relative z-40 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900">
          Demo workspace · data stays in this browser · AI analysis and shared accounts require database setup
        </div>
      )}
      <DashboardShell
        connected={
          context
            ? {
                userName: context.user.name,
                role: context.role,
                workspaceName: context.organization.name,
                employees,
              }
            : undefined
        }
      >
        {children}
      </DashboardShell>
    </>
  );
}
