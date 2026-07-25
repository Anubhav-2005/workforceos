import Link from "next/link";
import { ArrowLeft, SearchX, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7fb] p-5 text-slate-950">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl shadow-slate-200/60 sm:p-10">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
          <SearchX size={22} />
        </span>
        <p className="mt-6 text-xs font-bold tracking-[0.16em] text-indigo-600 uppercase">404</p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.04em]">This workspace page does not exist</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
          The link may be outdated, or the AI employee you were looking for is unavailable.
        </p>
        <Link
          href="/dashboard/overview"
          className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
        >
          <ArrowLeft size={16} /> Return to dashboard
        </Link>
        <div className="mt-8 flex items-center justify-center gap-2 border-t border-slate-100 pt-6 text-xs font-bold text-slate-400">
          <Sparkles size={14} className="text-indigo-500" /> workforceOS
        </div>
      </section>
    </main>
  );
}
