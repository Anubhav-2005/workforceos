import "server-only";
import type { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/db";
import { getWorkflowAgentError, runWorkflowAgent } from "@/lib/ai/run-workflow-agent";
import {
  InvalidWorkflowError,
  nextWorkflowNode,
  validateWorkflowGraph,
  type WorkflowGraph,
  type WorkflowGraphNode,
} from "@/lib/workflows/graph";

type JsonObject = Record<string, Prisma.JsonValue>;

type StoredNode = WorkflowGraphNode & { employeeId: string | null };
type StoredDefinition = { nodes: StoredNode[]; edges: WorkflowGraph["edges"] };

export class WorkflowRunError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "WorkflowRunError";
  }
}

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function storedDefinition(value: unknown): StoredDefinition {
  if (!value || typeof value !== "object") throw new InvalidWorkflowError("The execution definition is missing.");
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.nodes) || !Array.isArray(record.edges)) {
    throw new InvalidWorkflowError("The execution definition is invalid.");
  }
  const nodes = record.nodes.map((raw) => {
    const node = raw as Record<string, unknown>;
    return {
      key: String(node.key ?? ""),
      title: String(node.title ?? ""),
      type: String(node.type ?? "") as WorkflowGraphNode["type"],
      config: asObject(node.config),
      employeeId: asString(node.employeeId),
    };
  });
  const edges = record.edges.map((raw) => {
    const edge = raw as Record<string, unknown>;
    const config = asObject(edge.condition);
    return {
      sourceKey: String(edge.sourceKey ?? ""),
      targetKey: String(edge.targetKey ?? ""),
      condition: typeof config.value === "boolean" ? config.value : null,
    };
  });
  const graph = { nodes, edges };
  validateWorkflowGraph(graph);
  return graph;
}

export async function startWorkflowRun(input: {
  organizationId: string;
  workflowId: string;
  userId: string;
  candidateId?: string;
}) {
  const db = getPrisma();
  const workflow = await db.workflow.findFirst({
    where: { id: input.workflowId, organizationId: input.organizationId },
    include: { nodes: true, edges: true },
  });
  if (!workflow) throw new WorkflowRunError("Workflow not found.", 404);
  if (!workflow.enabled || workflow.status !== "Active") {
    throw new WorkflowRunError("Activate this workflow before running it.", 409);
  }

  const definition = storedDefinition({
    nodes: workflow.nodes.map((node) => ({
      key: node.key,
      title: node.title,
      type: node.type,
      config: node.config,
      employeeId: node.employeeId,
    })),
    edges: workflow.edges.map((edge) => ({
      sourceKey: edge.sourceKey,
      targetKey: edge.targetKey,
      condition: edge.condition,
    })),
  });
  if (definition.nodes.some((node) => node.config.mode === "use_existing_analysis") && !input.candidateId) {
    throw new WorkflowRunError("Select an analyzed candidate before starting this workflow.", 422);
  }

  let context: JsonObject = {};
  if (input.candidateId) {
    const candidate = await db.candidate.findFirst({
      where: { id: input.candidateId, organizationId: input.organizationId },
      include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!candidate) throw new WorkflowRunError("Candidate not found in this workspace.", 404);
    const analysis = candidate.analyses[0];
    if (!analysis) throw new WorkflowRunError("Analyze this candidate before starting the workflow.", 422);
    const assessment = asObject(analysis.result);
    context = {
      candidate: {
        id: candidate.id,
        name: candidate.name,
        currentRole: candidate.currentRole,
        score: candidate.aiScore,
        assessment: {
          skills: assessment.skills ?? [],
          strengths: assessment.strengths ?? [],
          recommendedRole: assessment.recommendedRole ?? candidate.currentRole,
          reasoning: assessment.reasoning ?? "",
        },
      },
    };
  }

  const firstNode = definition.nodes.find((node) => node.type === "START");
  if (!firstNode) throw new InvalidWorkflowError("A workflow start node is missing.");
  const execution = await db.workflowExecution.create({
    data: {
      organizationId: input.organizationId,
      workflowId: workflow.id,
      createdById: input.userId,
      status: "Queued",
      currentNodeKey: firstNode.key,
      definition: definition as unknown as Prisma.InputJsonValue,
      input: { candidateId: input.candidateId ?? null },
      context: context as Prisma.InputJsonValue,
    },
  });
  await db.activityEvent.create({
    data: {
      organizationId: input.organizationId,
      actorType: "user",
      actorId: input.userId,
      action: "workflow.started",
      entityType: "workflowExecution",
      entityId: execution.id,
      title: `${workflow.name} started`,
    },
  });
  await db.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorUserId: input.userId,
      action: "workflow.started",
      entityType: "workflowExecution",
      entityId: execution.id,
    },
  });
  return execution;
}

export async function advanceWorkflowRun(organizationId: string, executionId: string) {
  const db = getPrisma();
  const execution = await db.workflowExecution.findFirst({ where: { id: executionId, organizationId } });
  if (!execution) throw new WorkflowRunError("Workflow run not found.", 404);
  if (
    execution.status === "WaitingForApproval" ||
    execution.status === "Completed" ||
    execution.status === "Failed" ||
    execution.status === "Cancelled"
  )
    return getWorkflowRun(organizationId, executionId);
  if (execution.status !== "Queued") throw new WorkflowRunError("This workflow step is already running.", 409);

  const claimed = await db.workflowExecution.updateMany({
    where: { id: executionId, organizationId, status: "Queued" },
    data: { status: "Running", startedAt: execution.startedAt ?? new Date() },
  });
  if (claimed.count !== 1) throw new WorkflowRunError("This workflow step is already running.", 409);

  const definition = storedDefinition(execution.definition);
  const node = definition.nodes.find((item) => item.key === execution.currentNodeKey);
  if (!node) throw new WorkflowRunError("The current workflow node is missing.", 422);
  const previousContext = asObject(execution.context);
  const step = await db.workflowExecutionStep.create({
    data: {
      executionId,
      nodeKey: node.key,
      status: "Running",
      input: previousContext as Prisma.InputJsonValue,
      startedAt: new Date(),
    },
  });

  try {
    if (node.type === "HUMAN_APPROVAL") {
      const approverIds = await db.organizationMember.findMany({
        where: { organizationId, role: { in: ["Owner", "Admin", "Manager"] } },
        select: { userId: true },
      });
      await db.$transaction(async (tx) => {
        const approval = await tx.approval.create({
          data: {
            organizationId,
            workflowExecutionId: executionId,
            candidateId: asString(asObject(previousContext.candidate).id),
            action: asString(node.config.action) ?? `Review ${node.title}`,
            reason: asString(node.config.reason) ?? "Human review is required before work continues.",
            risk: "High",
            evidence: previousContext.candidate ? { candidate: previousContext.candidate } : undefined,
          },
        });
        await tx.workflowExecutionStep.update({ where: { id: step.id }, data: { status: "Waiting" } });
        await tx.workflowExecution.update({
          where: { id: executionId },
          data: { status: "WaitingForApproval", currentNodeKey: node.key },
        });
        if (approverIds.length) {
          await tx.notification.createMany({
            data: approverIds.map(({ userId }) => ({
              organizationId,
              userId,
              type: "approval.requested",
              title: "Workflow needs your approval",
              body: node.title,
              href: `/dashboard/approvals?approval=${approval.id}`,
            })),
          });
        }
        await tx.activityEvent.create({
          data: {
            organizationId,
            actorType: "system",
            action: "approval.requested",
            entityType: "approval",
            entityId: approval.id,
            title: `${node.title} is waiting for a reviewer`,
          },
        });
      });
      return getWorkflowRun(organizationId, executionId);
    }

    const result = await executeNode(organizationId, node, previousContext);
    const nextContext: JsonObject = { ...previousContext, ...result.context };
    const nextNodeKey = nextWorkflowNode(definition, node.key, result.condition);
    await db.$transaction(async (tx) => {
      await tx.workflowExecutionStep.update({
        where: { id: step.id },
        data: {
          status: "Completed",
          output: result.output as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });
      await tx.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: nextNodeKey ? "Queued" : "Completed",
          currentNodeKey: nextNodeKey,
          context: nextContext as Prisma.InputJsonValue,
          output: nextNodeKey ? undefined : (result.output as Prisma.InputJsonValue),
          completedAt: nextNodeKey ? undefined : new Date(),
        },
      });
      await tx.activityEvent.create({
        data: {
          organizationId,
          actorType: node.type === "AI_EMPLOYEE" ? "ai_employee" : "system",
          actorId: node.employeeId,
          action: nextNodeKey ? "workflow.step.completed" : "workflow.completed",
          entityType: "workflowExecution",
          entityId: executionId,
          title: `${node.title} ${nextNodeKey ? "completed" : "finished the workflow"}`,
          metadata: { nodeKey: node.key },
        },
      });
    });
  } catch (error) {
    const message = getWorkflowAgentError(error).slice(0, 500);
    await db.$transaction(async (tx) => {
      await tx.workflowExecutionStep.update({
        where: { id: step.id },
        data: { status: "Failed", error: message, completedAt: new Date() },
      });
      await tx.workflowExecution.update({
        where: { id: executionId },
        data: { status: "Failed", error: message, completedAt: new Date() },
      });
      await tx.activityEvent.create({
        data: {
          organizationId,
          actorType: "system",
          action: "workflow.failed",
          entityType: "workflowExecution",
          entityId: executionId,
          title: `${node.title} failed`,
          metadata: { nodeKey: node.key },
        },
      });
    });
  }
  return getWorkflowRun(organizationId, executionId);
}

async function executeNode(
  organizationId: string,
  node: StoredNode,
  context: JsonObject,
): Promise<{ output: JsonObject; context: JsonObject; condition?: boolean }> {
  if (node.type === "START" || node.type === "END") {
    return { output: { message: node.title }, context: {}, condition: undefined };
  }
  if (node.type === "CONDITION") {
    const field = asString(node.config.field);
    const operator = asString(node.config.operator);
    const expected = asNumber(node.config.value);
    if (!field || !/^[a-zA-Z][a-zA-Z0-9_.]{0,99}$/.test(field) || !operator || expected === null) {
      throw new WorkflowRunError("Condition configuration is invalid.", 422);
    }
    const actual = asNumber(field.split(".").reduce<unknown>((value, part) => asObject(value)[part], context));
    if (actual === null) throw new WorkflowRunError("The condition value is missing.", 422);
    const matched =
      operator === "gte"
        ? actual >= expected
        : operator === "gt"
          ? actual > expected
          : operator === "lte"
            ? actual <= expected
            : operator === "lt"
              ? actual < expected
              : operator === "eq"
                ? actual === expected
                : null;
    if (matched === null) throw new WorkflowRunError("Condition operator is unsupported.", 422);
    return { output: { field, matched }, context: {}, condition: matched };
  }
  if (node.type === "DELAY") {
    const seconds = asNumber(node.config.seconds);
    if (seconds === null || seconds < 0 || seconds > 3) {
      throw new WorkflowRunError("Delay nodes support 0 to 3 seconds per step.", 422);
    }
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    return { output: { waitedSeconds: seconds }, context: {}, condition: undefined };
  }
  if (node.type === "ACTION") {
    if (node.config.action !== "save_draft") {
      throw new WorkflowRunError("This action is not connected or permitted.", 422);
    }
    const draft = asString(asObject(context.latestDraft).draft);
    if (!draft) throw new WorkflowRunError("No AI draft is available to save.", 422);
    return {
      output: { saved: true, deliveredExternally: false },
      context: { savedDraft: { draft, savedAt: new Date().toISOString() } },
      condition: undefined,
    };
  }
  if (node.type === "AI_EMPLOYEE") {
    if (!node.employeeId) throw new WorkflowRunError("Assign an AI employee to this step.", 422);
    const employee = await getPrisma().aIEmployee.findFirst({
      where: { id: node.employeeId, organizationId, enabled: true, status: "Active" },
    });
    if (!employee) throw new WorkflowRunError("The assigned AI employee is unavailable.", 422);

    if (node.config.mode === "use_existing_analysis") {
      const candidate = asObject(context.candidate);
      const assessment = asObject(candidate.assessment);
      if (!asString(candidate.id) || !asString(assessment.reasoning)) {
        throw new WorkflowRunError("Select a candidate with a completed Recruiter analysis.", 422);
      }
      const summary = `${employee.name} provided the existing review for ${asString(candidate.name) ?? "the candidate"}.`;
      return { output: { summary, source: "persisted_resume_analysis" }, context: {}, condition: undefined };
    }

    const generated = await runWorkflowAgent({
      role: employee.role,
      instructions: asString(node.config.instructions) ?? employee.instructions ?? node.title,
      context,
    });
    return {
      output: generated,
      context: { latestDraft: generated },
      condition: undefined,
    };
  }
  throw new WorkflowRunError("Unsupported workflow node.", 422);
}

export async function getWorkflowRun(organizationId: string, executionId: string) {
  const db = getPrisma();
  const staleBefore = new Date(Date.now() - 2 * 60_000);
  const recovered = await db.workflowExecution.updateMany({
    where: { id: executionId, organizationId, status: "Running", updatedAt: { lt: staleBefore } },
    data: { status: "Failed", error: "This run was interrupted. Start a new run to retry.", completedAt: new Date() },
  });
  if (recovered.count) {
    await db.workflowExecutionStep.updateMany({
      where: { executionId, status: "Running" },
      data: { status: "Failed", error: "Execution interrupted.", completedAt: new Date() },
    });
    await db.activityEvent.create({
      data: {
        organizationId,
        actorType: "system",
        action: "workflow.interrupted",
        entityType: "workflowExecution",
        entityId: executionId,
        title: "Workflow run was interrupted",
      },
    });
  }
  return db.workflowExecution.findFirst({
    where: { id: executionId, organizationId },
    include: {
      workflow: { select: { id: true, name: true } },
      steps: { orderBy: { createdAt: "asc" } },
      approvals: {
        orderBy: { requestedAt: "desc" },
        select: {
          id: true,
          status: true,
          action: true,
          requestedAt: true,
          decidedAt: true,
          reviewerComment: true,
        },
      },
    },
  });
}

export async function decideWorkflowApproval(input: {
  organizationId: string;
  approvalId: string;
  reviewerId: string;
  decision: "Approved" | "Rejected";
  comment?: string;
}) {
  const db = getPrisma();
  const approval = await db.approval.findFirst({
    where: { id: input.approvalId, organizationId: input.organizationId },
    include: { workflowExecution: true },
  });
  if (!approval) throw new WorkflowRunError("Approval not found.", 404);
  if (!approval.workflowExecution) throw new WorkflowRunError("This approval is not linked to a workflow.", 422);
  if (approval.status !== "Pending") {
    throw new WorkflowRunError("This approval has already been decided.", 409);
  }
  if (approval.workflowExecution.status !== "WaitingForApproval") {
    throw new WorkflowRunError("The workflow is no longer waiting for this approval.", 409);
  }

  const execution = approval.workflowExecution;
  const definition = storedDefinition(execution.definition);
  const currentNode = definition.nodes.find((node) => node.key === execution.currentNodeKey);
  if (!currentNode || currentNode.type !== "HUMAN_APPROVAL") {
    throw new WorkflowRunError("The approval step no longer matches this workflow run.", 409);
  }
  const nextNodeKey = input.decision === "Approved" ? nextWorkflowNode(definition, currentNode.key) : null;
  const comment = input.comment?.trim().slice(0, 2_000) || null;

  await db.$transaction(async (tx) => {
    const claimed = await tx.approval.updateMany({
      where: { id: approval.id, organizationId: input.organizationId, status: "Pending" },
      data: {
        status: input.decision,
        reviewerId: input.reviewerId,
        reviewerComment: comment,
        decidedAt: new Date(),
      },
    });
    if (claimed.count !== 1) throw new WorkflowRunError("This approval was already decided.", 409);

    const moved = await tx.workflowExecution.updateMany({
      where: { id: execution.id, organizationId: input.organizationId, status: "WaitingForApproval" },
      data: {
        status: input.decision === "Approved" ? "Queued" : "Cancelled",
        currentNodeKey: nextNodeKey,
        completedAt: input.decision === "Rejected" ? new Date() : null,
        error: input.decision === "Rejected" ? "The reviewer rejected this handoff." : null,
      },
    });
    if (moved.count !== 1) throw new WorkflowRunError("This workflow has already resumed.", 409);

    await tx.workflowExecutionStep.updateMany({
      where: { executionId: execution.id, nodeKey: currentNode.key, status: "Waiting" },
      data: {
        status: input.decision === "Approved" ? "Completed" : "Skipped",
        output: { decision: input.decision, reviewerComment: comment },
        completedAt: new Date(),
      },
    });
    if (approval.candidateId) {
      await tx.candidate.updateMany({
        where: { id: approval.candidateId, organizationId: input.organizationId },
        data: { status: input.decision === "Approved" ? "Approved" : "Rejected" },
      });
    }
    await tx.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorUserId: input.reviewerId,
        action: `approval.${input.decision.toLowerCase()}`,
        entityType: "approval",
        entityId: approval.id,
        before: { status: "Pending" },
        after: { status: input.decision },
      },
    });
    await tx.activityEvent.create({
      data: {
        organizationId: input.organizationId,
        actorType: "user",
        actorId: input.reviewerId,
        action: `approval.${input.decision.toLowerCase()}`,
        entityType: "workflowExecution",
        entityId: execution.id,
        title: input.decision === "Approved" ? "Workflow handoff approved" : "Workflow handoff rejected",
      },
    });
    if (execution.createdById && execution.createdById !== input.reviewerId) {
      await tx.notification.create({
        data: {
          organizationId: input.organizationId,
          userId: execution.createdById,
          type: `approval.${input.decision.toLowerCase()}`,
          title: input.decision === "Approved" ? "Your workflow can continue" : "Your workflow was stopped",
          href: `/dashboard/workflows?run=${execution.id}`,
        },
      });
    }
  });
  return getWorkflowRun(input.organizationId, execution.id);
}

export async function cancelWorkflowRun(organizationId: string, executionId: string, userId: string) {
  const db = getPrisma();
  const updated = await db.workflowExecution.updateMany({
    where: { id: executionId, organizationId, status: { in: ["Queued", "WaitingForApproval"] } },
    data: { status: "Cancelled", completedAt: new Date() },
  });
  if (updated.count !== 1) throw new WorkflowRunError("This run cannot be cancelled now.", 409);
  await db.approval.updateMany({
    where: { workflowExecutionId: executionId, organizationId, status: "Pending" },
    data: { status: "Cancelled", decidedAt: new Date() },
  });
  await db.auditLog.create({
    data: {
      organizationId,
      actorUserId: userId,
      action: "workflow.cancelled",
      entityType: "workflowExecution",
      entityId: executionId,
    },
  });
  return getWorkflowRun(organizationId, executionId);
}
