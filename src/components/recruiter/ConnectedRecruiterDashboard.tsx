"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import type { Candidate, HumanStatus, RecruiterAnalysisSource, RecruiterMetrics } from "@/lib/recruiter-data";
import { isCandidateRecord, toCandidate } from "@/lib/recruiter-client";
import type { RecruiterAnalysis } from "@/types/recruiter";
import CandidateDrawer from "@/components/recruiter/CandidateDrawer";
import ConnectedRecruiterOverview from "@/components/recruiter/ConnectedRecruiterOverview";
import RecruiterHeader from "@/components/recruiter/RecruiterHeader";
import AnalyticsTab from "@/components/recruiter/tabs/AnalyticsTab";
import ApprovalsTab from "@/components/recruiter/tabs/ApprovalsTab";
import CandidatesTab from "@/components/recruiter/tabs/CandidatesTab";
import ResumeReviewTab from "@/components/recruiter/tabs/ResumeReviewTab";

type Tab = "Overview" | "Candidates" | "Resume Review" | "Approvals" | "Analytics";
const tabs: Tab[] = ["Overview", "Candidates", "Resume Review", "Approvals", "Analytics"];
const pageSize = 50;
const emptyMetrics: RecruiterMetrics = {
  receivedCount: 0,
  reviewedCount: 0,
  pendingApprovalCount: 0,
  decisionedCount: 0,
  approvedCount: 0,
  advancedCount: 0,
  averageReviewedScore: 0,
  approvalRate: 0,
};

export default function ConnectedRecruiterDashboard() {
  const { notify, workspaceRole } = useDashboard();
  const [tab, setTab] = useState<Tab>("Overview");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([]);
  const [pending, setPending] = useState<Candidate[]>([]);
  const [metrics, setMetrics] = useState<RecruiterMetrics>(emptyMetrics);
  const [candidatePage, setCandidatePage] = useState(1);
  const [candidatePages, setCandidatePages] = useState(0);
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingPages, setPendingPages] = useState(0);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<RecruiterAnalysis | null>(null);
  const [analysisSource, setAnalysisSource] = useState<RecruiterAnalysisSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const requestVersion = useRef(0);

  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    setRefreshing(true);
    try {
      const [candidateResponse, recentResponse, pendingResponse, summaryResponse] = await Promise.all([
        fetch(`/api/candidates?limit=${pageSize}&page=${candidatePage}`, { cache: "no-store" }),
        fetch("/api/candidates?limit=4", { cache: "no-store" }),
        fetch(`/api/candidates?status=ReviewRequired&approvalStatus=Pending&limit=${pageSize}&page=${pendingPage}`, {
          cache: "no-store",
        }),
        fetch("/api/recruiter/summary", { cache: "no-store" }),
      ]);
      const [candidatePayload, recentPayload, pendingPayload, summaryPayload]: unknown[] = await Promise.all([
        candidateResponse.json(),
        recentResponse.json(),
        pendingResponse.json(),
        summaryResponse.json(),
      ]);
      if (!candidateResponse.ok || !isCandidatePage(candidatePayload))
        throw new Error(getError(candidatePayload, "Could not load candidates."));
      if (!recentResponse.ok || !isCandidatePage(recentPayload))
        throw new Error(getError(recentPayload, "Could not load recent candidates."));
      if (!pendingResponse.ok || !isCandidatePage(pendingPayload))
        throw new Error(getError(pendingPayload, "Could not load approvals."));
      if (!summaryResponse.ok || !isMetricsPayload(summaryPayload))
        throw new Error(getError(summaryPayload, "Could not load recruiter metrics."));
      if (version !== requestVersion.current) return;
      setCandidates(candidatePayload.candidates.filter(isCandidateRecord).map(toCandidate));
      setRecentCandidates(recentPayload.candidates.filter(isCandidateRecord).map(toCandidate));
      setPending(
        pendingPayload.candidates
          .filter(isCandidateRecord)
          .map(toCandidate)
          .filter((item) => item.approvalId),
      );
      setMetrics(summaryPayload.metrics);
      setCandidatePages(candidatePayload.pages);
      setPendingPages(pendingPayload.pages);
      if (candidatePage > Math.max(1, candidatePayload.pages)) setCandidatePage(Math.max(1, candidatePayload.pages));
      if (pendingPage > Math.max(1, pendingPayload.pages)) setPendingPage(Math.max(1, pendingPayload.pages));
      setError("");
    } catch (cause) {
      if (version === requestVersion.current)
        setError(cause instanceof Error ? cause.message : "Could not load candidates.");
    } finally {
      if (version === requestVersion.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [candidatePage, pendingPage]);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);
  const updateStatus = async (candidateId: string, status: HumanStatus) => {
    const candidate = pending.find((item) => item.id === candidateId);
    if (!candidate?.approvalId || busyId) return;
    const action = status === "Approved" ? "approve" : status === "Rejected" ? "reject" : "interview";
    setBusyId(candidateId);
    try {
      const response = await fetch(`/api/approvals/${candidate.approvalId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(getError(payload, "Could not record the decision."));
      await refresh();
      notify(`${candidate.name}: ${status.toLowerCase()}.`);
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : "Could not record the decision.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const createDemo = async () => {
    try {
      const response = await fetch("/api/recruiter/demo", { method: "POST" });
      const payload: unknown = await response.json();
      if (!response.ok || !payload || typeof payload !== "object" || !("analysis" in payload)) {
        throw new Error(getError(payload, "Could not create the demo result."));
      }
      setLatestAnalysis(payload.analysis as RecruiterAnalysis);
      setAnalysisSource("demo");
      setCandidatePage(1);
      setPendingPage(1);
      await refresh();
      notify("Fictional demo analysis saved. No live AI request was made.", "info");
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : "Could not create the demo result.", "error");
    }
  };

  const deleteCandidate = async (candidate: Candidate) => {
    if (!window.confirm(`Delete ${candidate.name}'s candidate data? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/candidates/${candidate.id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload: unknown = await response.json();
        throw new Error(getError(payload, "Could not delete this candidate."));
      }
      setSelectedCandidate(null);
      await refresh();
      notify("Candidate data deleted.");
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : "Could not delete this candidate.", "error");
    }
  };

  if (loading)
    return (
      <div className="mx-auto max-w-[1480px] animate-pulse px-5 py-8 sm:px-8 lg:px-10">
        <div className="h-64 rounded-2xl bg-white" />
        <div className="mt-6 h-12 rounded-xl bg-white" />
        <div className="mt-7 h-72 rounded-2xl bg-white" />
      </div>
    );

  return (
    <div className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8 lg:px-10">
      <RecruiterHeader
        metrics={{
          reviewed: metrics.reviewedCount,
          pending: metrics.pendingApprovalCount,
          averageScore: metrics.averageReviewedScore,
        }}
      />
      {error && (
        <div
          role="alert"
          className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
        >
          <span>{error}</span>
          <button type="button" onClick={() => void refresh()} className="font-bold underline">
            Retry
          </button>
        </div>
      )}
      <nav
        className="mt-6 flex overflow-x-auto rounded-xl border border-slate-200 bg-white p-1"
        aria-label="Recruiter workspace tabs"
      >
        {tabs.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => setTab(item)}
            aria-current={tab === item ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition sm:px-4 ${tab === item ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-slate-800"}`}
          >
            {item}
          </button>
        ))}
      </nav>
      <div className="mt-7">
        {tab === "Overview" && (
          <ConnectedRecruiterOverview
            candidates={recentCandidates}
            pendingCount={metrics.pendingApprovalCount}
            onOpenCandidate={setSelectedCandidate}
            onOpenApprovals={() => setTab("Approvals")}
            onOpenResumeReview={() => setTab("Resume Review")}
          />
        )}
        {tab === "Candidates" && (
          <CandidatesTab
            candidates={candidates}
            loading={refreshing}
            total={metrics.receivedCount}
            page={candidatePage}
            pages={candidatePages}
            onPageChange={setCandidatePage}
            onOpenCandidate={setSelectedCandidate}
          />
        )}
        {tab === "Resume Review" && (
          <ResumeReviewTab
            latestAnalysis={latestAnalysis}
            analysisSource={analysisSource}
            onAnalyzed={(analysis) => {
              setLatestAnalysis(analysis);
              setAnalysisSource("openai");
              setCandidatePage(1);
              setPendingPage(1);
              void refresh();
            }}
            onError={(message) => notify(message, "error")}
            onUseDemo={() => void createDemo()}
          />
        )}
        {tab === "Approvals" && (
          <div className={busyId ? "pointer-events-none opacity-60" : ""}>
            <ApprovalsTab
              candidates={pending}
              loading={refreshing}
              page={pendingPage}
              pages={pendingPages}
              onPageChange={setPendingPage}
              onUpdate={(id, status) => void updateStatus(id, status)}
            />
          </div>
        )}
        {tab === "Analytics" && <AnalyticsTab metrics={metrics} />}
      </div>
      {selectedCandidate && (
        <CandidateDrawer
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onDelete={
            workspaceRole === "Owner" || workspaceRole === "Admin"
              ? () => void deleteCandidate(selectedCandidate)
              : undefined
          }
        />
      )}
    </div>
  );
}

function getError(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string")
    return payload.error;
  return fallback;
}

function isCandidatePage(value: unknown): value is { candidates: unknown[]; pages: number } {
  return (
    !!value &&
    typeof value === "object" &&
    "candidates" in value &&
    Array.isArray(value.candidates) &&
    "pages" in value &&
    typeof value.pages === "number"
  );
}

function isMetricsPayload(value: unknown): value is { metrics: RecruiterMetrics } {
  if (!value || typeof value !== "object" || !("metrics" in value)) return false;
  const metrics = value.metrics;
  return (
    !!metrics &&
    typeof metrics === "object" &&
    Object.keys(emptyMetrics).every(
      (key) => key in metrics && typeof (metrics as Record<string, unknown>)[key] === "number",
    )
  );
}
