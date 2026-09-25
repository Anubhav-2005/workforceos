import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { getWorkspaceContext } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";
import ConnectedEmployeeActions from "@/components/dashboard/ConnectedEmployeeActions";

export default async function ConnectedEmployeeDetailPage({ id }: { id: string }) {
  const context = await getWorkspaceContext();
  if (!context) return null;
  const db = getPrisma();
  const employee = await db.aIEmployee.findFirst({
    where: { organizationId: context.organization.id, id },
    include: {
      tasks: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { tasks: true, taskExecutions: true } },
    },
  });
  if (!employee) notFound();
  const [completed, pending] = await Promise.all([
    db.task.count({ where: { organizationId: context.organization.id, assignedEmployeeId: id, status: "Completed" } }),
    db.approval.count({
      where: { organizationId: context.organization.id, requestingEmployeeId: id, status: "Pending" },
    }),
  ]);
  return (
    <div className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8 lg:px-10">
      <Link
        href="/dashboard/employees"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-indigo-600"
      >
        <ArrowLeft size={15} /> Back to AI employees
      </Link>
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-600">
              {employee.name.slice(0, 1)}
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-[-0.04em]">{employee.name}</h1>
              <p className="mt-1 text-sm text-slate-500">{employee.role}</p>
              <span
                className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${employee.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
              >
                {employee.enabled ? employee.status : "Paused"}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <ConnectedEmployeeActions kind="assign" employeeId={employee.id} />
            {["Owner", "Admin", "Manager"].includes(context.role) && (
              <ConnectedEmployeeActions kind="toggle" employeeId={employee.id} enabled={employee.enabled} />
            )}
          </div>
        </div>
        <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-600">
          {employee.description || "This AI employee is ready for a focused assignment."}
        </p>
      </section>
      <div className="mt-7 grid gap-7 lg:grid-cols-[1.45fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold">Assigned tasks</p>
              <p className="mt-1 text-xs text-slate-500">Current work and recent outcomes.</p>
            </div>
            <Link href="/dashboard/tasks" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              View all
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {employee.tasks.length ? (
              employee.tasks.map((task) => (
                <Link
                  href="/dashboard/tasks"
                  key={task.id}
                  className="block rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50"
                >
                  <p className="text-sm font-bold text-slate-800">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {task.status} · {task.priority} priority
                  </p>
                </Link>
              ))
            ) : (
              <p className="rounded-xl border border-slate-100 p-4 text-xs text-slate-500">No tasks assigned yet.</p>
            )}
          </div>
        </section>
        <div className="space-y-7">
          <section className="rounded-2xl bg-[#171b31] p-5 text-white shadow-xl shadow-slate-200">
            <p className="text-sm font-medium text-slate-300">Performance</p>
            <p className="mt-2 text-3xl font-bold tracking-[-0.05em]">{completed}</p>
            <p className="mt-1 text-xs text-slate-400">Completed tasks</p>
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
              <div>
                <p className="text-lg font-bold">{employee._count.tasks}</p>
                <p className="text-[10px] text-slate-400">Assigned</p>
              </div>
              <div>
                <p className="text-lg font-bold">{employee._count.taskExecutions}</p>
                <p className="text-[10px] text-slate-400">Executions</p>
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-amber-500" />
              <p className="text-base font-bold">Pending approvals</p>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              {pending} decision{pending === 1 ? "" : "s"} awaiting review.
            </p>
            <Link
              href="/dashboard/approvals"
              className="mt-4 inline-flex rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Open approvals
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
