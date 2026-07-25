"use client";

import { RefreshCw } from "lucide-react";

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="grid min-h-screen place-items-center bg-[#f6f7fb] p-5 text-slate-950">
          <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/60">
            <h1 className="text-2xl font-bold tracking-[-0.04em]">WorkforceOS needs a quick reset</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              An unexpected problem interrupted the application. Retry to restore the workspace.
            </p>
            <button
              type="button"
              onClick={unstable_retry}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white"
            >
              <RefreshCw size={16} /> Reload workspace
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
