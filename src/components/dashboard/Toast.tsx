import { Check, X } from "lucide-react";

export default function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed inset-x-3 bottom-3 z-[70] flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-2xl sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-sm"
    >
      <Check size={16} className="shrink-0 text-emerald-400" />
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
