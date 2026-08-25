import { AlertCircle, Check, Info, X } from "lucide-react";
import type { ToastTone } from "@/components/dashboard/DashboardShell";

export default function Toast({
  message,
  tone,
  onDismiss,
}: {
  message: string;
  tone: ToastTone;
  onDismiss: () => void;
}) {
  const Icon = tone === "error" ? AlertCircle : tone === "info" ? Info : Check;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
      aria-atomic="true"
      className="fixed inset-x-3 bottom-3 z-[70] flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-2xl sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-sm"
    >
      <Icon
        size={16}
        className={`shrink-0 ${tone === "error" ? "text-rose-400" : tone === "info" ? "text-sky-400" : "text-emerald-400"}`}
      />
      <span className="min-w-0 flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss message"
        className="ml-2 shrink-0 text-slate-400 transition hover:text-white"
      >
        <X size={15} />
      </button>
    </div>
  );
}
