export default function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 90
      ? "bg-emerald-50 text-emerald-700"
      : score >= 80
        ? "bg-indigo-50 text-indigo-700"
        : "bg-amber-50 text-amber-700";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${color}`}>{score}% AI score</span>
  );
}
