import Link from "next/link";
import { Activity, ArrowUpRight, CheckCircle2, Clock3, Play, ShieldCheck } from "lucide-react";
import { Metric } from "@/components/dashboard/OverviewWidgets";
import { getWorkspaceContext } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";

export default async function ConnectedOverviewPage({ search = "" }: { search?: string }) {
  const context = await getWorkspaceContext();
  if (!context) return null;
  const db = getPrisma();
  const organizationId = context.organization.id;
  const query = search.trim().slice(0, 100);
  const [employees, completed, pending, running, events, tasks] = await Promise.all([
    db.aIEmployee.findMany({
      where: { organizationId, enabled: true },
      include: { _count: { select: { tasks: true } } },
      orderBy: { createdAt: "asc" },
      take: 6,
    }),
    db.task.count({ where: { organizationId, status: "Completed" } }),
    db.approval.count({ where: { organizationId, status: "Pending" } }),
    db.task.count({ where: { organizationId, status: "Running" } }),
    db.activityEvent.findMany({
      where: {
        organizationId,
        ...(query
          ? {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { action: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    db.task.count({ where: { organizationId } }),
  ]);

  return (
    <div className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8 lg:px-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-indigo-600">Live workspace</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.045em] text-slate-900 sm:text-[34px]">
            Welcome, {context.user.name.split(" ")[0]} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">Here&apos;s what your AI workforce is moving forward today.</p>
        </div>
        <Link
          href="/dashboard/tasks"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#4f46e5] px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
        >
          <Play size={16} fill="currentColor" /> Open work queue
        </Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          href="/dashboard/tasks"
          title="Tasks completed"
          value={String(completed)}
          trend="Live"
          icon={<CheckCircle2 size={19} />}
          color="indigo"
          footer="All time"
        />
        <Metric
          href="/dashboard/tasks"
          title="Tasks in progress"
          value={String(running)}
          trend="Live"
          icon={<Clock3 size={19} />}
          color="violet"
          footer="Currently running"
        />
        <Metric
          href="/dashboard/approvals"
          title="Human approvals"
          value={String(pending)}
          trend="Live"
          icon={<ShieldCheck size={19} />}
          color="amber"
          footer="Awaiting a decision"
        />
        <Metric
          href="/dashboard/analytics"
          title="Work created"
          value={String(tasks)}
          trend="Live"
          icon={<Activity size={19} />}
          color="cyan"
          footer="Total tasks"
        />
      </div>
      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.62fr)_minmax(330px,0.85fr)]">
        <div className="min-w-0 space-y-7">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-bold tracking-[-0.02em]">Your AI employees</p>
                <p className="mt-1 text-xs text-slate-500">A focused view of work in motion.</p>
              </div>
              <Link
                href="/dashboard/employees"
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Manage all <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {employees.map((employee) => (
                <Link
                  key={employee.id}
                  href={`/dashboard/employees/${employee.slug === "maya" ? "recruiter" : employee.id}`}
                  className="group rounded-xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 font-bold text-indigo-600">
                    {employee.name.slice(0, 1)}
                  </span>
                  <p className="mt-4 text-sm font-bold">{employee.name}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{employee.role}</p>
                  <div className="mt-4 rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-600">
                    {employee._count.tasks} assigned tasks · {employee.status}
                  </div>
                </Link>
              ))}
              {!employees.length && <p className="text-sm text-slate-500">No AI employees yet.</p>}
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <p className="text-base font-bold tracking-[-0.02em]">Work activity</p>
              <p className="mt-1 text-xs text-slate-500">Recent events from this workspace.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {events.length ? (
                events.map((event) => (
                  <div key={event.id} className="px-5 py-4 sm:px-6">
                    <p className="text-xs font-semibold text-slate-800">{event.title}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{event.createdAt.toLocaleString("en-IN")}</p>
                  </div>
                ))
              ) : (
                <p className="p-8 text-center text-sm text-slate-400">
                  {query
                    ? "No matching activity found."
                    : "No activity yet. Create a task or review a resume to get started."}
                </p>
              )}
            </div>
          </section>
        </div>
        <div className="min-w-0 space-y-7">
          <Link
            href="/dashboard/analytics"
            className="block rounded-2xl bg-[#171b31] p-5 text-white shadow-xl shadow-slate-200 transition hover:-translate-y-0.5 sm:p-6"
          >
            <p className="text-sm font-medium text-slate-300">Workforce progress</p>
            <p className="mt-3 text-3xl font-bold">
              {completed}
              <span className="ml-2 text-sm font-normal text-slate-400">tasks completed</span>
            </p>
            <p className="mt-6 text-xs text-slate-300">
              View measured execution metrics <ArrowUpRight size={14} className="inline" />
            </p>
          </Link>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-6">
            <p className="text-base font-bold">Needs your attention</p>
            <p className="mt-1 text-xs text-slate-500">Decisions only a human can make.</p>
            <Link
              href="/dashboard/approvals"
              className="mt-5 flex items-center justify-between rounded-xl border border-slate-100 p-3 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {pending ? `${pending} pending approval${pending === 1 ? "" : "s"}` : "No pending approvals"}
              <ArrowUpRight size={15} />
            </Link>
          </section>
          <section className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
            <p className="text-sm font-bold text-slate-900">Ask your workforce</p>
            <p className="mt-1 text-xs text-slate-500">Create a focused task for an AI employee.</p>
            <Link
              href="/dashboard/tasks"
              className="mt-4 block rounded-xl border border-indigo-100 bg-white px-3 py-2.5 text-xs font-semibold text-indigo-600"
            >
              Open task queue →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
