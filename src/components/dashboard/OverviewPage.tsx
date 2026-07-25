"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Activity, ArrowUpRight, Check, CheckCircle2, Clock3, MoreHorizontal, Play, ShieldCheck } from "lucide-react";
import { agents } from "@/lib/dashboard-data";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import OverviewInsights from "@/components/dashboard/OverviewInsights";
import { ActivityRow, AgentOverviewCard, Metric } from "@/components/dashboard/OverviewWidgets";

export default function OverviewPage() {
  const { tasks, notify } = useDashboard();
  const searchParams = useSearchParams();
  const [running, setRunning] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [activityMenu, setActivityMenu] = useState(false);
  const query = searchParams.get("search")?.toLowerCase() ?? "";
  const visibleActivity = useMemo(
    () => tasks.filter((item) => item.action.toLowerCase().includes(query) || item.agent.toLowerCase().includes(query)),
    [query, tasks],
  );
  const shownActivity = showAll ? visibleActivity : visibleActivity.slice(0, 4);

  const runStandup = () => {
    setRunning(true);
    window.setTimeout(() => {
      setRunning(false);
      notify("Daily standup completed. Your workforce is aligned.");
    }, 900);
  };

  return (
    <div className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8 lg:px-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-indigo-600">Friday, July 25</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.045em] text-slate-900 sm:text-[34px]">
            Good morning, Anubhav{" "}
            <span className="inline-block origin-bottom-right animate-[wave_2s_ease-in-out_infinite]">👋</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">Here&apos;s what your AI workforce is moving forward today.</p>
        </div>
        <button
          type="button"
          onClick={runStandup}
          disabled={running}
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold shadow-lg transition disabled:cursor-wait ${
            running
              ? "bg-emerald-600 text-white shadow-emerald-200"
              : "bg-[#4f46e5] text-white shadow-indigo-200 hover:bg-indigo-700"
          }`}
        >
          {running ? (
            <>
              <Check size={17} /> Standup running
            </>
          ) : (
            <>
              <Play size={16} fill="currentColor" /> Run daily standup
            </>
          )}
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          href="/dashboard/overview"
          title="Tasks completed"
          value="72"
          trend="+18.4%"
          icon={<CheckCircle2 size={19} />}
          color="indigo"
          footer="vs. last week"
        />
        <Metric
          href="/dashboard/analytics"
          title="Hours reclaimed"
          value="24.5"
          suffix=" hrs"
          trend="+12.8%"
          icon={<Clock3 size={19} />}
          color="violet"
          footer="This week"
        />
        <Metric
          href="/dashboard/employees/recruiter"
          title="Human approvals"
          value="8"
          trend="3 new"
          icon={<ShieldCheck size={19} />}
          color="amber"
          footer="Awaiting a decision"
        />
        <Metric
          href="/dashboard/analytics"
          title="Team satisfaction"
          value="94"
          suffix="%"
          trend="+2.1%"
          icon={<Activity size={19} />}
          color="cyan"
          footer="Based on feedback"
        />
      </div>

      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.62fr)_minmax(330px,0.85fr)]">
        <div className="space-y-7">
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
              {agents.map((agent) => (
                <AgentOverviewCard key={agent.id} agent={agent} />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <p className="text-base font-bold tracking-[-0.02em]">Work activity</p>
                <p className="mt-1 text-xs text-slate-500">A live log of your AI team&apos;s impact.</p>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActivityMenu((value) => !value)}
                  aria-label="Activity options"
                  aria-expanded={activityMenu}
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-50"
                >
                  <MoreHorizontal size={18} />
                </button>
                {activityMenu && (
                  <div className="absolute right-0 z-10 mt-2 w-36 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAll(true);
                        setActivityMenu(false);
                      }}
                      className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50"
                    >
                      Show all activity
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAll(false);
                        setActivityMenu(false);
                      }}
                      className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50"
                    >
                      Show recent only
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {shownActivity.length ? (
                shownActivity.map((item) => <ActivityRow key={item.id} item={item} />)
              ) : (
                <p className="p-8 text-center text-sm text-slate-400">No matching activity found.</p>
              )}
            </div>
            {visibleActivity.length > 4 && (
              <button
                type="button"
                onClick={() => setShowAll((value) => !value)}
                className="w-full border-t border-slate-100 py-3.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600"
              >
                {showAll ? "Show recent activity" : "View all activity"}
              </button>
            )}
          </section>
        </div>

        <OverviewInsights />
      </div>
    </div>
  );
}
