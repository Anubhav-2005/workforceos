"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardShell";

type Approval = {
  id: string;
  action: string;
  reason: string | null;
  status: string;
  requestedAt: string;
  candidate: { id: string; name: string; aiScore: number | null; currentRole: string | null } | null;
  requestingEmployee: { name: string } | null;
  workflowExecution: { id: string; status: string } | null;
};

export default function ConnectedApprovalsPage() {
  const { notify } = useDashboard();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState("Pending");
  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/approvals?status=${filter}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load approvals.");
      setApprovals(data.approvals);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not load approvals.", "error");
    } finally {
      setLoading(false);
    }
  }, [filter, notify]);
  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);
  const decide = async (id: string, action: "approve" | "reject" | "interview") => {
    setBusyId(id);
    try {
      const response = await fetch(`/api/approvals/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not record the decision.");
      notify(
        action === "approve"
          ? "Approval recorded. Continue the workflow from Workflows."
          : action === "reject"
            ? "Candidate rejected."
            : "Interview requested.",
      );
      await load();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not record the decision.", "error");
    } finally {
      setBusyId(null);
    }
  };
  return (
    <div className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8 lg:px-10">
      <div>
        <p className="text-sm font-medium text-indigo-600">Human-in-the-loop</p>
        <h1 className="mt-1 text-3xl font-bold tracking-[-0.045em] text-slate-900 sm:text-[34px]">Approvals</h1>
        <p className="mt-2 text-sm text-slate-500">High-impact decisions stay with your team.</p>
      </div>
      <div className="mt-8 flex gap-2">
        {["Pending", "Approved", "Rejected"].map((status) => (
          <button
            key={status}
            onClick={() => {
              setLoading(true);
              setFilter(status);
            }}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${filter === status ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
          >
            {status}
          </button>
        ))}
        <button
          onClick={() => void load()}
          aria-label="Refresh approvals"
          className="rounded-xl border border-slate-200 bg-white px-3 text-slate-600 hover:bg-slate-50"
        >
          <RotateCcw size={14} />
        </button>
      </div>
      {loading ? (
        <div className="mt-5 h-40 animate-pulse rounded-2xl bg-white" />
      ) : (
        <div className="mt-5 space-y-3">
          {approvals.length ? (
            approvals.map((approval) => (
              <section
                key={approval.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)]"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
                    <ShieldCheck size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{approval.action}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {approval.reason || "Review this decision before work continues."}
                    </p>
                    <p className="mt-2 text-[11px] text-slate-400">
                      {approval.requestingEmployee?.name || "WorkforceOS"} ·{" "}
                      {new Date(approval.requestedAt).toLocaleString("en-IN")}
                    </p>
                    {approval.candidate && (
                      <Link
                        href="/dashboard/employees/recruiter"
                        className="mt-3 block text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        {approval.candidate.name} · {approval.candidate.currentRole || "Candidate"} · AI score{" "}
                        {approval.candidate.aiScore ?? "—"}
                      </Link>
                    )}
                  </div>
                </div>
                {filter === "Pending" && (
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <button
                      disabled={busyId === approval.id}
                      onClick={() => void decide(approval.id, "approve")}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      disabled={busyId === approval.id}
                      onClick={() => void decide(approval.id, "reject")}
                      className="rounded-xl border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    {approval.candidate && !approval.workflowExecution && (
                      <button
                        disabled={busyId === approval.id}
                        onClick={() => void decide(approval.id, "interview")}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Request interview
                      </button>
                    )}
                  </div>
                )}
                {approval.workflowExecution?.status === "WaitingForApproval" && (
                  <Link
                    href="/dashboard/workflows"
                    className="mt-3 inline-block text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    View paused workflow →
                  </Link>
                )}
              </section>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              No {filter.toLowerCase()} approvals.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
