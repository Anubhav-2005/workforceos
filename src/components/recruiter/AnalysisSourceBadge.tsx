import type { RecruiterAnalysisSource } from "@/lib/recruiter-data";

export default function AnalysisSourceBadge({ source }: { source?: RecruiterAnalysisSource }) {
  if (source !== "demo") return null;

  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold tracking-wide text-amber-700 uppercase">
      Demo data
    </span>
  );
}
