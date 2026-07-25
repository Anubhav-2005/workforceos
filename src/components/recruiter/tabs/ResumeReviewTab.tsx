import dynamic from "next/dynamic";
import { FileText } from "lucide-react";
import type { RecruiterAnalysis } from "@/types/recruiter";
import ResumeAnalysis from "@/components/recruiter/ResumeAnalysis";

const ResumeUploader = dynamic(() => import("@/components/recruiter/ResumeUploader"), {
  loading: () => <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />,
});

export default function ResumeReviewTab({
  latestAnalysis,
  onAnalyzed,
  onError,
}: {
  latestAnalysis: RecruiterAnalysis | null;
  onAnalyzed: (analysis: RecruiterAnalysis) => void;
  onError: (message: string) => void;
}) {
  return (
    <div className="grid gap-7 xl:grid-cols-[0.85fr_1.15fr]">
      <ResumeUploader onAnalyzed={onAnalyzed} onError={onError} />
      <div>
        {latestAnalysis ? (
          <ResumeAnalysis analysis={latestAnalysis} />
        ) : (
          <section className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <div>
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-400">
                <FileText size={18} />
              </span>
              <p className="mt-4 text-sm font-bold text-slate-700">Your analysis will appear here</p>
              <p className="mt-1 text-xs text-slate-500">Upload a PDF resume to generate a structured AI review.</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
