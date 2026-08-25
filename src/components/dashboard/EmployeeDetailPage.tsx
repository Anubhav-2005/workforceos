"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, CirclePause, Clock3, Play, Plus, ShieldCheck } from "lucide-react";
import type { Agent } from "@/lib/dashboard-data";
import Avatar from "@/components/dashboard/Avatar";
import { useDashboard } from "@/components/dashboard/DashboardShell";

export default function EmployeeDetailPage({ agent }: { agent: Agent }) {
  const { openTaskModal, notify } = useDashboard();
  const [paused, setPaused] = useState(false);
  const [approved, setApproved] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const progress = Math.round((agent.completed / agent.total) * 100);

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
            <Avatar agent={agent} size="lg" />
            <div>
              <h1 className="text-2xl font-bold tracking-[-0.04em]">{agent.name}</h1>
              <p className="mt-1 text-sm text-slate-500">{agent.role}</p>
              <span
                className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${paused ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${paused ? "bg-slate-400" : "bg-emerald-500"}`} />
                {paused ? "Paused" : agent.status}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openTaskModal({ assignTo: agent.id })}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
            >
              <Plus size={15} /> Assign work
            </button>
            <button
              onClick={() => {
                setPaused((value) => !value);
                notify(`${agent.name} is now ${paused ? "active" : "paused"}.`);
              }}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              aria-label={paused ? "Resume employee" : "Pause employee"}
            >
              {paused ? <Play size={16} /> : <CirclePause size={16} />}
            </button>
          </div>
        </div>
        <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-600">{agent.description}</p>
      </section>
      <div className="mt-7 grid gap-7 lg:grid-cols-[1.45fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold">Assigned tasks</p>
              <p className="mt-1 text-xs text-slate-500">Current work and recent outcomes.</p>
            </div>
            <button
              onClick={() => openTaskModal({ assignTo: agent.id })}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Add task
            </button>
          </div>
          <div className="mt-5 rounded-xl border border-slate-100 p-4">
            <p className="text-sm font-bold text-slate-800">{agent.task}</p>
            <p className="mt-1 text-xs text-slate-500">In progress · updated 8 minutes ago</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs font-semibold text-slate-600">
                {agent.completed}/{agent.total}
              </span>
            </div>
          </div>
        </section>
        <div className="space-y-7">
          <section className="rounded-2xl bg-[#171b31] p-5 text-white shadow-xl shadow-slate-200">
            <p className="text-sm font-medium text-slate-300">Performance</p>
            <p className="mt-2 text-3xl font-bold tracking-[-0.05em]">{agent.performance.split(" ")[0]}</p>
            <p className="mt-1 text-xs text-slate-400">
              {agent.performance.replace(agent.performance.split(" ")[0], "").trim()}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
              <div>
                <p className="text-lg font-bold">{agent.completed}</p>
                <p className="text-[10px] text-slate-400">Tasks moved</p>
              </div>
              <div>
                <p className="text-lg font-bold">{progress}%</p>
                <p className="text-[10px] text-slate-400">Assignment done</p>
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-amber-500" />
              <p className="text-base font-bold">Pending approval</p>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Review the recommended next action before it moves forward.
            </p>
            <button
              onClick={() => {
                setApproved(true);
                notify(approved ? "This approval was already recorded." : "Approval recorded locally.");
              }}
              className={`mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${approved ? "bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-slate-800"}`}
            >
              {approved ? (
                <>
                  <Check size={14} /> Approved
                </>
              ) : (
                "Review & approve"
              )}
            </button>
            <button
              type="button"
              aria-expanded={activityOpen}
              onClick={() => setActivityOpen((value) => !value)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Clock3 size={14} /> {activityOpen ? "Hide activity log" : "View activity log"}
            </button>
            {activityOpen && (
              <div className="mt-3 space-y-3 border-t border-slate-100 pt-3" aria-label={`${agent.name} activity log`}>
                <ActivityLogItem title={`Advanced “${agent.task}”`} time="8 min ago" />
                <ActivityLogItem title="Updated the shared workspace summary" time="24 min ago" />
                <ActivityLogItem title="Prepared an item for human review" time="1 hr ago" />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function ActivityLogItem({ title, time }: { title: string; time: string }) {
  return (
    <div className="flex gap-2.5 text-xs">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
      <div className="min-w-0">
        <p className="font-medium text-slate-700">{title}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">{time}</p>
      </div>
    </div>
  );
}
