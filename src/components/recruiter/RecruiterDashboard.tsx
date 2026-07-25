"use client";

import { useCallback, useMemo, useState } from "react";
import { initialCandidates, isCandidateList, type Candidate, type HumanStatus } from "@/lib/recruiter-data";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import type { RecruiterAnalysis } from "@/types/recruiter";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import CandidateDrawer from "@/components/recruiter/CandidateDrawer";
import RecruiterHeader from "@/components/recruiter/RecruiterHeader";
import AnalyticsTab from "@/components/recruiter/tabs/AnalyticsTab";
import ApprovalsTab from "@/components/recruiter/tabs/ApprovalsTab";
import CandidatesTab from "@/components/recruiter/tabs/CandidatesTab";
import RecruiterOverviewTab from "@/components/recruiter/tabs/RecruiterOverviewTab";
import ResumeReviewTab from "@/components/recruiter/tabs/ResumeReviewTab";

type RecruiterTab = "Overview" | "Candidates" | "Resume Review" | "Approvals" | "Analytics";

const tabs: RecruiterTab[] = ["Overview", "Candidates", "Resume Review", "Approvals", "Analytics"];

export default function RecruiterDashboard() {
  const { notify, openTaskModal } = useDashboard();
  const [tab, setTab] = useState<RecruiterTab>("Overview");
  const [candidates, setCandidates, hydrated] = useLocalStorageState<Candidate[]>(
    "workforceos-recruiter-candidates",
    initialCandidates,
    { validate: isCandidateList },
  );
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<RecruiterAnalysis | null>(null);

  const pendingCandidates = useMemo(
    () => candidates.filter((candidate) => candidate.humanStatus === "Pending approval"),
    [candidates],
  );
  const averageScore = candidates.length
    ? Math.round(candidates.reduce((total, candidate) => total + candidate.aiScore, 0) / candidates.length)
    : 0;
  const approvalRate = candidates.length
    ? Math.round(((candidates.length - pendingCandidates.length) / candidates.length) * 100)
    : 0;

  const closeCandidate = useCallback(() => setSelectedCandidate(null), []);

  const updateStatus = (candidateId: string, humanStatus: HumanStatus) => {
    const candidate = candidates.find((item) => item.id === candidateId);
    setCandidates((current) => current.map((item) => (item.id === candidateId ? { ...item, humanStatus } : item)));
    if (candidate) notify(`${candidate.name}: ${humanStatus.toLowerCase()}.`);
  };

  const saveAnalysis = (analysis: RecruiterAnalysis) => {
    const candidate: Candidate = {
      id: crypto.randomUUID(),
      name: analysis.candidateName.trim() || "Unnamed candidate",
      role: analysis.recommendedRole.trim() || analysis.currentRole.trim() || "Role not identified",
      experience: `${analysis.yearsExperience} years`,
      skills: analysis.skills,
      resumeStatus: "Reviewed",
      aiScore: analysis.score,
      humanStatus: "Pending approval",
      summary: analysis.reasoning,
      analysis,
    };
    setCandidates((current) => [candidate, ...current]);
    setLatestAnalysis(analysis);
    notify(`${candidate.name} was added to the approval queue.`);
  };

  if (!hydrated) return <RecruiterSkeleton />;

  return (
    <div className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8 lg:px-10">
      <RecruiterHeader />
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
            className={`rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition sm:px-4 ${
              tab === item ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="mt-7">
        {tab === "Overview" && (
          <RecruiterOverviewTab
            candidates={candidates}
            pendingCount={pendingCandidates.length}
            averageScore={averageScore}
            onOpenCandidate={setSelectedCandidate}
            onOpenApprovals={() => setTab("Approvals")}
            onCreateTask={() => openTaskModal({ assignTo: "recruiter", name: "Review Recruiter priority queue" })}
          />
        )}
        {tab === "Candidates" && <CandidatesTab candidates={candidates} onOpenCandidate={setSelectedCandidate} />}
        {tab === "Resume Review" && (
          <ResumeReviewTab latestAnalysis={latestAnalysis} onAnalyzed={saveAnalysis} onError={notify} />
        )}
        {tab === "Approvals" && <ApprovalsTab candidates={pendingCandidates} onUpdate={updateStatus} />}
        {tab === "Analytics" && (
          <AnalyticsTab candidates={candidates} averageScore={averageScore} approvalRate={approvalRate} />
        )}
      </div>

      {selectedCandidate && <CandidateDrawer candidate={selectedCandidate} onClose={closeCandidate} />}
    </div>
  );
}

function RecruiterSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 rounded-2xl bg-white" />
      <div className="mt-6 h-12 rounded-xl bg-white" />
      <div className="mt-7 grid gap-7 xl:grid-cols-2">
        <div className="h-72 rounded-2xl bg-white" />
        <div className="h-72 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}
