"use client";

import Link from "next/link";
import { ArrowUpRight, BarChart3, CalendarDays, MessageSquare, Send, Sparkles, Users } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import type { ReactNode } from "react";

export default function OverviewInsights() {
  const { openTaskModal } = useDashboard();

  return (
    <div className="space-y-7">
      <Link
        href="/dashboard/analytics"
        className="block overflow-hidden rounded-2xl bg-[#171b31] p-5 text-white shadow-xl shadow-slate-200 transition hover:-translate-y-0.5 sm:p-6"
      >
        <div className="flex items-center justify-between">
          <div className="rounded-lg bg-white/10 p-2">
            <BarChart3 size={19} className="text-violet-200" />
          </div>
          <span className="rounded-lg bg-white/10 p-1.5 text-xs text-slate-300">Details</span>
        </div>
        <p className="mt-5 text-sm font-medium text-slate-300">Workforce efficiency</p>
        <div className="mt-1 flex items-end justify-between">
          <p className="text-3xl font-bold tracking-[-0.05em]">
            86.4<span className="text-lg text-slate-400">%</span>
          </p>
          <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
            ↑ 8.2%
          </span>
        </div>
        <div className="mt-6 flex h-20 items-end gap-2">
          {[35, 48, 40, 67, 56, 76, 86].map((height, index) => (
            <div key={height} className="group flex-1">
              <div
                style={{ height: `${height}%` }}
                className={`min-h-2 rounded-t-md transition-all group-hover:opacity-80 ${
                  index === 6 ? "bg-violet-400" : "bg-white/15"
                }`}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-slate-500">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-bold tracking-[-0.02em]">Needs your attention</p>
            <p className="mt-1 text-xs text-slate-500">Decisions only a human can make.</p>
          </div>
          <span className="grid h-6 min-w-6 place-items-center rounded-full bg-rose-50 px-1.5 text-[10px] font-bold text-rose-600">
            3
          </span>
        </div>
        <div className="mt-5 space-y-3">
          <ApprovalLink
            href="/dashboard/employees/recruiter"
            title="Approve shortlisted candidates"
            description="6 profiles matched for Product Designer"
            icon={<Users size={17} />}
            iconClass="bg-violet-50 text-violet-600"
          />
          <ApprovalLink
            href="/dashboard/employees/theo"
            title="Review client response"
            description="Theo drafted a reply to Northstar"
            icon={<MessageSquare size={17} />}
            iconClass="bg-amber-50 text-amber-600"
          />
          <ApprovalLink
            href="/dashboard/employees/recruiter"
            title="Confirm interview schedule"
            description="2 candidate slots need your sign-off"
            icon={<CalendarDays size={17} />}
            iconClass="bg-cyan-50 text-cyan-600"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
        <div className="flex gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-indigo-600 shadow-sm">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Ask your workforce</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Get a concise progress update or create a new task.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            openTaskModal({
              name: "Review today’s priorities",
              description: "Summarize what needs attention today and recommend the next best action.",
            })
          }
          className="mt-4 flex w-full items-center justify-between rounded-xl border border-indigo-100 bg-white px-3 py-2.5 text-left text-xs text-slate-400 shadow-sm transition hover:border-indigo-300"
        >
          What needs attention today?
          <Send size={15} className="text-indigo-600" />
        </button>
      </section>
    </div>
  );
}

function ApprovalLink({
  href,
  title,
  description,
  icon,
  iconClass,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  iconClass: string;
}) {
  return (
    <Link
      href={href}
      className="group flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-slate-200 hover:bg-slate-50"
    >
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${iconClass}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-slate-800">{title}</p>
        <p className="mt-1 truncate text-[10px] text-slate-500">{description}</p>
      </div>
      <ArrowUpRight size={15} className="text-slate-300 transition group-hover:text-indigo-600" />
    </Link>
  );
}
