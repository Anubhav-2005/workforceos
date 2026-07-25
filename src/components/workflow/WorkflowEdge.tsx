"use client";

import { motion } from "framer-motion";

export default function WorkflowEdge({ active, complete }: { active: boolean; complete: boolean }) {
  return (
    <div className="relative mx-2 h-px w-8 shrink-0 overflow-hidden bg-slate-200 md:w-12">
      <div className={`h-full ${complete ? "bg-emerald-400" : active ? "bg-indigo-400" : "bg-slate-200"}`} />
      {active && (
        <motion.span
          initial={{ x: -12 }}
          animate={{ x: 54 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
          className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-indigo-600 shadow-sm"
        />
      )}
    </div>
  );
}
