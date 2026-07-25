"use client";

import { useRef, type Dispatch, type SetStateAction } from "react";
import { createIdleRuntime, createLog, withNodeStatus } from "@/services/workflowEngine";
import type { WorkflowRuntime } from "@/types/workflow";

type SimulationOptions = {
  setRuntime: Dispatch<SetStateAction<WorkflowRuntime>>;
  notify: (message: string) => void;
};

export function useWorkflowSimulation({ setRuntime, notify }: SimulationOptions) {
  const runVersion = useRef(0);
  const update = (
    node: Parameters<typeof withNodeStatus>[1],
    status: Parameters<typeof withNodeStatus>[2],
    message: string,
    tone: ReturnType<typeof createLog>["tone"] = "default",
    phase?: WorkflowRuntime["phase"],
  ) => {
    setRuntime((current) => ({
      ...withNodeStatus(current, node, status),
      phase: phase ?? current.phase,
      logs: [...current.logs, createLog(message, tone)],
    }));
  };
  const sleep = () => new Promise((resolve) => window.setTimeout(resolve, 700));
  const isCurrentRun = (version: number) => runVersion.current === version;

  const run = async () => {
    const version = ++runVersion.current;
    setRuntime({ ...createIdleRuntime(), phase: "running", logs: [createLog("Resume uploaded")] });

    update("resume", "Running", "Resume ingestion started");
    await sleep();
    if (!isCurrentRun(version)) return;

    update("resume", "Completed", "Resume text extracted", "success");
    update("recruiter", "Running", "Recruiter analyzing candidate profile");
    await sleep();
    if (!isCurrentRun(version)) return;

    update("recruiter", "Completed", "Candidate scored 92", "success");
    update("approval", "Waiting", "Waiting for human approval", "warning", "awaiting_approval");
  };

  const approve = async () => {
    const version = ++runVersion.current;

    update("approval", "Completed", "Candidate approved", "success", "running");
    update("sales", "Running", "Sales generating onboarding handoff");
    await sleep();
    if (!isCurrentRun(version)) return;

    update("sales", "Completed", "Sales prepared onboarding context", "success");
    update("email", "Running", "Sales generated onboarding email");
    await sleep();
    if (!isCurrentRun(version)) return;

    update("email", "Completed", "Onboarding email ready", "success");
    update("support", "Running", "Customer Support preparing welcome guide");
    await sleep();
    if (!isCurrentRun(version)) return;

    update("support", "Completed", "Customer Support created welcome package", "success");
    update("complete", "Completed", "Workflow completed", "success", "completed");
    notify("Candidate onboarding workflow completed.");
  };

  const reject = () => {
    runVersion.current += 1;
    update("approval", "Failed", "Candidate rejected by human approval", "danger", "failed");
    notify("Workflow stopped after the candidate was rejected.");
  };

  const reset = () => {
    runVersion.current += 1;
    setRuntime(createIdleRuntime());
  };

  return { run, approve, reject, reset };
}
