import Link from "next/link";
import { ArrowRight, CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export default function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-[1080px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:grid-cols-[0.9fr_1fr]">
        <section className="hidden flex-col justify-between bg-[#171b31] p-10 text-white lg:flex xl:p-12">
          <Link href="/" className="inline-flex w-fit items-center gap-3 text-lg font-bold tracking-[-0.04em]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600">
              <Sparkles size={20} strokeWidth={2.4} />
            </span>
            workforce<span className="text-indigo-300">OS</span>
          </Link>

          <div className="py-14">
            <p className="text-xs font-semibold tracking-[0.18em] text-indigo-300 uppercase">WorkforceOS</p>
            <h1 className="mt-5 max-w-sm text-[38px] leading-[1.16] font-bold tracking-[-0.055em]">
              Your AI workforce, under control.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">
              Assign work to specialized AI employees. Review important decisions. Follow every handoff from start to
              finish.
            </p>

            <div className="mt-10 space-y-4">
              <Feature icon={<CheckCircle2 size={17} />} text="One place for tasks, candidates, and workflows" />
              <Feature icon={<LockKeyhole size={17} />} text="Human approval before consequential actions" />
              <Feature icon={<ArrowRight size={17} />} text="A clear record of work and decisions" />
            </div>
          </div>

          <p className="text-xs text-slate-400">Built for teams that need useful AI and clear accountability.</p>
        </section>

        <section className="flex min-h-[600px] flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
          <Link
            href="/"
            className="mb-12 inline-flex w-fit items-center gap-2 text-base font-bold tracking-[-0.04em] lg:hidden"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">
              <Sparkles size={18} strokeWidth={2.4} />
            </span>
            workforce<span className="text-indigo-600">OS</span>
          </Link>
          {children}
        </section>
      </div>
    </main>
  );
}

function Feature({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-200">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-indigo-200">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
