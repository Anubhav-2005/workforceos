"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Bot, Filter, Plus, Sparkles } from "lucide-react";
import { agents } from "@/lib/dashboard-data";
import Avatar from "@/components/dashboard/Avatar";
import { useDashboard } from "@/components/dashboard/DashboardShell";

export default function EmployeesPage() {
  const { openTaskModal } = useDashboard();
  const [activeOnly, setActiveOnly] = useState(false);
  const displayedAgents = activeOnly ? agents.filter((agent) => agent.status !== "Waiting") : agents;

  return (
    <div className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8 lg:px-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-indigo-600">AI workforce</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.045em] text-slate-900 sm:text-[34px]">AI employees</h1>
          <p className="mt-2 text-sm text-slate-500">Hire, direct, and review the people who move your work forward.</p>
        </div>
        <button
          onClick={() => openTaskModal()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
        >
          <Plus size={17} /> Assign work
        </button>
      </div>
      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">{displayedAgents.length} AI employees</p>
        <button
          onClick={() => setActiveOnly((value) => !value)}
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${activeOnly ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
        >
          <Filter size={14} /> {activeOnly ? "Showing active" : "Filter active"}
        </button>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {displayedAgents.map((agent) => {
          const progress = Math.round((agent.completed / agent.total) * 100);
          return (
            <Link
              key={agent.id}
              href={`/dashboard/employees/${agent.id}`}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <Avatar agent={agent} size="lg" />
                <ArrowUpRight size={17} className="text-slate-300 transition group-hover:text-indigo-600" />
              </div>
              <div className="mt-5">
                <p className="text-base font-bold">{agent.name}</p>
                <p className="mt-1 text-xs text-slate-500">{agent.role}</p>
              </div>
              <div className="mt-5 rounded-xl bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-slate-600">{agent.task}</p>
                  <span className="text-[10px] font-bold text-indigo-600">{progress}%</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-[11px] text-slate-500">
                <Sparkles size={14} className="text-indigo-500" />
                {agent.performance}
              </div>
            </Link>
          );
        })}
      </div>
      <section className="mt-7 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-6 text-center">
        <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-white text-indigo-600 shadow-sm">
          <Bot size={19} />
        </div>
        <p className="mt-3 text-sm font-bold text-slate-800">Need a new specialist?</p>
        <p className="mt-1 text-xs text-slate-500">Start with a focused task and assign it to the right AI employee.</p>
        <button
          onClick={() => openTaskModal()}
          className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          Create a task <ArrowUpRight className="inline" size={13} />
        </button>
      </section>
    </div>
  );
}
