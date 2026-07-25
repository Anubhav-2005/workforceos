"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";

export default function DashboardError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-76px)] max-w-[900px] place-items-center px-5 py-10 sm:px-8">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-[0_2px_12px_rgba(15,23,42,0.035)] sm:p-10">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-600">
          <TriangleAlert size={20} />
        </span>
        <h1 className="mt-5 text-xl font-bold tracking-[-0.03em] text-slate-900">This workspace view could not load</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Your saved work is still available. Retry the view to continue.
        </p>
        <button
          type="button"
          onClick={unstable_retry}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <RefreshCw size={15} /> Try again
        </button>
      </section>
    </div>
  );
}
