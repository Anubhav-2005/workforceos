import Link from "next/link";
import { CircleDot } from "lucide-react";
import { agents, type Agent, type WorkItem } from "@/lib/dashboard-data";
import Avatar from "@/components/dashboard/Avatar";
import type { ReactNode } from "react";

type MetricProps = {
  href: string;
  title: string;
  value: string;
  suffix?: string;
  trend: string;
  icon: ReactNode;
  color: "indigo" | "violet" | "amber" | "cyan";
  footer: string;
};

export function Metric({ href, title, value, suffix, trend, icon, color, footer }: MetricProps) {
  const styles: Record<MetricProps["color"], string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
    cyan: "bg-cyan-50 text-cyan-600",
  };

  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.025)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className={`grid h-9 w-9 place-items-center rounded-xl ${styles[color]}`}>{icon}</div>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">{trend}</span>
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold tracking-[-0.04em]">
        {value}
        <span className="text-base text-slate-500">{suffix}</span>
      </p>
      <p className="mt-2 text-[11px] text-slate-400">{footer}</p>
    </Link>
  );
}

export function AgentOverviewCard({ agent }: { agent: Agent }) {
  const statusStyles = {
    Working: "bg-emerald-50 text-emerald-700",
    Waiting: "bg-slate-100 text-slate-600",
    "Review needed": "bg-amber-50 text-amber-700",
  };
  const progress = Math.round((agent.completed / agent.total) * 100);

  return (
    <Link
      href={`/dashboard/employees/${agent.id}`}
      className="group relative overflow-hidden rounded-xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/60"
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${agent.glow} to-transparent opacity-70`}
      />
      <div className="relative">
        <div className="flex items-start justify-between">
          <Avatar agent={agent} />
          <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${statusStyles[agent.status]}`}>
            <span
              className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${
                agent.status === "Working"
                  ? "bg-emerald-500"
                  : agent.status === "Review needed"
                    ? "bg-amber-500"
                    : "bg-slate-400"
              }`}
            />
            {agent.status}
          </span>
        </div>
        <p className="mt-4 text-sm font-bold">{agent.name}</p>
        <p className="mt-0.5 text-[11px] text-slate-500">{agent.role}</p>
        <div className="mt-4 rounded-lg bg-white/80 p-2.5">
          <p className="truncate text-[11px] font-medium text-slate-600">{agent.task}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-slate-800" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] font-semibold text-slate-500">
              {agent.completed}/{agent.total}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ActivityRow({ item }: { item: WorkItem }) {
  const person = agents.find((agent) => agent.name === item.agent) ?? agents[0];
  const toneClasses: Record<WorkItem["tone"], string> = {
    violet: "bg-violet-100 text-violet-600",
    amber: "bg-amber-100 text-amber-600",
    cyan: "bg-cyan-100 text-cyan-600",
    indigo: "bg-indigo-100 text-indigo-600",
  };

  return (
    <Link
      href={`/dashboard/employees/${person.id}`}
      className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50 sm:px-6"
    >
      <Avatar agent={person} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-slate-600">
          <span className="font-bold text-slate-900">{item.agent}</span> {item.action}
        </p>
        <p className="mt-1 text-[10px] text-slate-400">{item.time}</p>
      </div>
      <span className={`hidden rounded-lg p-1.5 sm:block ${toneClasses[item.tone]}`} aria-hidden="true">
        <CircleDot size={14} />
      </span>
    </Link>
  );
}
