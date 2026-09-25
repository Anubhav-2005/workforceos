import Link from "next/link";
import { ArrowUpRight, Bot, Sparkles } from "lucide-react";
import { getWorkspaceContext } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";
import ConnectedEmployeeActions from "@/components/dashboard/ConnectedEmployeeActions";

export default async function ConnectedEmployeesPage() {
  const context = await getWorkspaceContext();
  if (!context) return null;
  const employees = await getPrisma().aIEmployee.findMany({
    where: { organizationId: context.organization.id },
    include: { _count: { select: { tasks: true, taskExecutions: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return (
    <div className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8 lg:px-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-indigo-600">AI workforce</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.045em] text-slate-900 sm:text-[34px]">AI employees</h1>
          <p className="mt-2 text-sm text-slate-500">Hire, direct, and review the people who move your work forward.</p>
        </div>
        <ConnectedEmployeeActions kind="assign" />
      </div>
      <p className="mt-8 text-sm font-semibold text-slate-700">{employees.length} AI employees</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {employees.map((employee) => (
          <Link
            key={employee.id}
            href={`/dashboard/employees/${employee.slug === "maya" ? "recruiter" : employee.id}`}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-600">
                {employee.name.slice(0, 1)}
              </span>
              <ArrowUpRight size={17} className="text-slate-300 transition group-hover:text-indigo-600" />
            </div>
            <div className="mt-5">
              <p className="text-base font-bold">{employee.name}</p>
              <p className="mt-1 text-xs text-slate-500">{employee.role}</p>
            </div>
            <div className="mt-5 rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-600">
                {employee.description || "Ready for a focused task."}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-[11px] text-slate-500">
              <Sparkles size={14} className="text-indigo-500" />
              {employee._count.tasks} tasks · {employee._count.taskExecutions} executions · {employee.status}
            </div>
          </Link>
        ))}
        {!employees.length && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No AI employees are configured yet.
          </div>
        )}
      </div>
      {["Owner", "Admin", "Manager"].includes(context.role) && (
        <section className="mt-7 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-6 text-center">
          <Bot size={20} className="mx-auto text-indigo-600" />
          <p className="mt-3 text-sm font-bold text-slate-800">Need a new specialist?</p>
          <p className="mt-1 text-xs text-slate-500">Add a focused AI employee to your workspace.</p>
          <ConnectedEmployeeActions kind="create" />
        </section>
      )}
    </div>
  );
}
