import { CheckCircle2 } from "lucide-react";
import type { Candidate, HumanStatus } from "@/lib/recruiter-data";
import ApprovalCard from "@/components/recruiter/ApprovalCard";

export default function ApprovalsTab({
  candidates,
  onUpdate,
}: {
  candidates: Candidate[];
  onUpdate: (candidateId: string, status: HumanStatus) => void;
}) {
  return (
    <section>
      <div>
        <p className="text-base font-bold">Candidate approvals</p>
        <p className="mt-1 text-xs text-slate-500">The Recruiter recommends. You make the final decision.</p>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {candidates.length ? (
          candidates.map((candidate) => (
            <ApprovalCard
              key={candidate.id}
              candidate={candidate}
              onUpdate={(status) => onUpdate(candidate.id, status)}
            />
          ))
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <CheckCircle2 className="mx-auto text-emerald-500" size={24} />
            <p className="mt-3 text-sm font-bold text-slate-700">Approval queue is clear</p>
            <p className="mt-1 text-xs text-slate-500">New high-confidence candidates will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );
}
