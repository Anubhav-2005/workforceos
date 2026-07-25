import type { Candidate } from "@/lib/recruiter-data";
import CandidateCard from "@/components/recruiter/CandidateCard";

export default function CandidatesTab({
  candidates,
  onOpenCandidate,
}: {
  candidates: Candidate[];
  onOpenCandidate: (candidate: Candidate) => void;
}) {
  return (
    <section>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-base font-bold">Candidate pipeline</p>
          <p className="mt-1 text-xs text-slate-500">Open a profile to view a detailed Recruiter assessment.</p>
        </div>
        <p className="text-xs font-semibold text-slate-500">{candidates.length} candidates</p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {candidates.map((candidate) => (
          <CandidateCard key={candidate.id} candidate={candidate} onSelect={() => onOpenCandidate(candidate)} />
        ))}
      </div>
    </section>
  );
}
