import type { Candidate } from "@/lib/recruiter-data";
import CandidateCard from "@/components/recruiter/CandidateCard";
import PaginationControls from "@/components/recruiter/PaginationControls";

export default function CandidatesTab({
  candidates,
  loading = false,
  total,
  page,
  pages,
  onPageChange,
  onOpenCandidate,
}: {
  candidates: Candidate[];
  loading?: boolean;
  total?: number;
  page?: number;
  pages?: number;
  onPageChange?: (page: number) => void;
  onOpenCandidate: (candidate: Candidate) => void;
}) {
  return (
    <section>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-base font-bold">Candidate pipeline</p>
          <p className="mt-1 text-xs text-slate-500">Open a profile to view a detailed Recruiter assessment.</p>
        </div>
        <p className="text-xs font-semibold text-slate-500">{total ?? candidates.length} candidates</p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-2xl bg-white" />
            ))
          : candidates.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} onSelect={() => onOpenCandidate(candidate)} />
            ))}
      </div>
      {page && pages && onPageChange && <PaginationControls page={page} pages={pages} onPageChange={onPageChange} />}
    </section>
  );
}
