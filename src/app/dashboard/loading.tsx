export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1480px] animate-pulse px-5 py-8 sm:px-8 lg:px-10">
      <div className="h-5 w-28 rounded bg-indigo-100" />
      <div className="mt-3 h-9 w-72 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-100" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-40 rounded-2xl bg-white" />
        ))}
      </div>
      <div className="mt-7 grid gap-7 xl:grid-cols-[1.62fr_0.85fr]">
        <div className="h-72 rounded-2xl bg-white" />
        <div className="h-72 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}
