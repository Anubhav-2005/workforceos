"use client";

import { useState } from "react";
import { Copy, Edit3, Plus, Trash2, Workflow } from "lucide-react";
import type { WorkflowDefinition } from "@/types/workflow";

type WorkflowSidebarProps = {
  workflows: WorkflowDefinition[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  connected?: boolean;
  canManage?: boolean;
};

export default function WorkflowSidebar(props: WorkflowSidebarProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const submitCreate = () => {
    const workflowName = name.trim();
    if (!workflowName) return;
    props.onCreate(workflowName);
    setName("");
    setCreating(false);
  };

  const submitEdit = () => {
    const workflowName = editingName.trim();
    if (!editingId || !workflowName) return;
    props.onRename(editingId, workflowName);
    setEditingId(null);
  };

  return (
    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-sm font-bold">Workflows</p>
          <p className="mt-1 text-[10px] text-slate-500">Your collaboration automations.</p>
        </div>
        {(props.canManage ?? true) && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            aria-label="Create workflow"
            className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {creating && (
        <div className="mt-4 rounded-xl bg-indigo-50 p-3">
          <label className="sr-only" htmlFor="workflow-name">
            Workflow name
          </label>
          <input
            id="workflow-name"
            autoFocus
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitCreate();
              if (event.key === "Escape") setCreating(false);
            }}
            placeholder="Workflow name"
            className="h-9 w-full rounded-lg border border-indigo-100 bg-white px-2.5 text-xs outline-none focus:border-indigo-400"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="px-2 py-1 text-[10px] font-semibold text-slate-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitCreate}
              disabled={!name.trim()}
              className="rounded-md bg-indigo-600 px-2 py-1 text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {props.workflows.length ? (
          props.workflows.map((workflow) => (
            <div
              key={workflow.id}
              className={`rounded-xl border p-3 transition ${
                props.selectedId === workflow.id
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-transparent hover:bg-slate-50"
              }`}
            >
              {editingId === workflow.id ? (
                <div>
                  <label className="sr-only" htmlFor={`edit-${workflow.id}`}>
                    Edit workflow name
                  </label>
                  <input
                    id={`edit-${workflow.id}`}
                    autoFocus
                    maxLength={80}
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") submitEdit();
                      if (event.key === "Escape") setEditingId(null);
                    }}
                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-indigo-400"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-[10px] font-semibold text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submitEdit}
                      disabled={!editingName.trim()}
                      className="text-[10px] font-semibold text-indigo-600 disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : deletingId === workflow.id ? (
                <div>
                  <p className="text-xs font-semibold text-slate-700">Delete this workflow?</p>
                  <p className="mt-1 text-[10px] leading-4 text-slate-500">
                    {props.connected
                      ? "This archives the workflow and keeps its run history."
                      : "This removes its locally saved configuration."}
                  </p>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDeletingId(null)}
                      className="text-[10px] font-semibold text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        props.onDelete(workflow.id);
                        setDeletingId(null);
                      }}
                      className="rounded-md bg-rose-600 px-2 py-1 text-[10px] font-semibold text-white"
                    >
                      {props.connected ? "Archive" : "Delete"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => props.onSelect(workflow.id)}
                    aria-current={props.selectedId === workflow.id}
                    className="flex w-full items-start gap-2 text-left"
                  >
                    <span
                      className={`mt-0.5 grid h-7 w-7 place-items-center rounded-lg ${workflow.enabled ? "bg-white text-indigo-600" : "bg-slate-100 text-slate-400"}`}
                    >
                      <Workflow size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-slate-700">{workflow.name}</span>
                      <span className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${workflow.enabled ? "bg-emerald-500" : "bg-slate-400"}`}
                        />
                        {workflow.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </span>
                  </button>
                  {(props.canManage ?? true) && (
                    <div className="mt-3 flex gap-1 border-t border-slate-100 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(workflow.id);
                          setEditingName(workflow.name);
                        }}
                        aria-label={`Edit ${workflow.name}`}
                        className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-white hover:text-indigo-600"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => props.onDuplicate(workflow.id)}
                        aria-label={`Duplicate ${workflow.name}`}
                        className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-white hover:text-indigo-600"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(workflow.id)}
                        aria-label={`Delete ${workflow.name}`}
                        className="ml-auto grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center">
            <Workflow className="mx-auto text-slate-300" size={18} />
            <p className="mt-2 text-xs font-semibold text-slate-500">No workflows yet</p>
            {(props.canManage ?? true) && (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="mt-2 text-[10px] font-semibold text-indigo-600"
              >
                Create your first workflow
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
