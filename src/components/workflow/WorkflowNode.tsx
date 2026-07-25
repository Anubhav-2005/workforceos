"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Bot, CheckCircle2, FileUp, Mail, UserRoundCheck, XCircle } from "lucide-react";
import type { WorkflowNodeDefinition, WorkflowNodeStatus } from "@/types/workflow";

const iconByKind = { event: FileUp, employee: Bot, approval: UserRoundCheck, action: Mail, complete: BadgeCheck };

export default function WorkflowNode({ node, status }: { node: WorkflowNodeDefinition; status: WorkflowNodeStatus }) {
  const Icon = iconByKind[node.kind];
  const statusClass =
    status === "Running"
      ? "bg-indigo-50 text-indigo-700"
      : status === "Waiting"
        ? "bg-amber-50 text-amber-700"
        : status === "Completed"
          ? "bg-emerald-50 text-emerald-700"
          : status === "Failed"
            ? "bg-rose-50 text-rose-700"
            : "bg-slate-100 text-slate-500";
  return (
    <motion.article
      animate={status === "Running" ? { scale: [1, 1.025, 1], y: [0, -2, 0] } : { scale: 1, y: 0 }}
      transition={status === "Running" ? { repeat: Infinity, duration: 1.15 } : { duration: 0.2 }}
      className={`relative w-40 shrink-0 rounded-2xl border bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.035)] transition ${status === "Running" ? "border-indigo-300 shadow-indigo-100" : status === "Completed" ? "border-emerald-200" : status === "Failed" ? "border-rose-200" : "border-slate-200"}`}
    >
      <div className="flex items-start justify-between">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-50 text-indigo-600">
          <Icon size={16} />
        </span>
        {status === "Completed" ? (
          <CheckCircle2 size={16} className="text-emerald-500" />
        ) : status === "Failed" ? (
          <XCircle size={16} className="text-rose-500" />
        ) : null}
      </div>
      <p className="mt-4 text-xs font-bold text-slate-900">{node.title}</p>
      <p className="mt-1 text-[10px] text-slate-500">{node.subtitle}</p>
      <span className={`mt-4 inline-flex rounded-full px-2 py-1 text-[9px] font-bold ${statusClass}`}>
        <span
          className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${status === "Running" ? "animate-pulse bg-indigo-500" : status === "Completed" ? "bg-emerald-500" : status === "Waiting" ? "bg-amber-500" : status === "Failed" ? "bg-rose-500" : "bg-slate-400"}`}
        />
        {status}
      </span>
    </motion.article>
  );
}
