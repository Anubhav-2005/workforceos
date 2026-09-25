import "server-only";
import { getWorkflowAgentError, runWorkflowAgent } from "@/lib/ai/run-workflow-agent";
import { getPrisma } from "@/lib/db";
import { WorkflowRunError } from "@/lib/workflows/runner";

export async function recoverStaleTasks(organizationId: string) {
  const db = getPrisma();
  const staleBefore = new Date(Date.now() - 2 * 60_000);
  const stale = await db.task.findMany({
    where: { organizationId, status: "Running", updatedAt: { lt: staleBefore } },
    select: { id: true },
    take: 100,
  });
  for (const task of stale) {
    const recovered = await db.task.updateMany({
      where: { id: task.id, organizationId, status: "Running", updatedAt: { lt: staleBefore } },
      data: { status: "Failed" },
    });
    if (!recovered.count) continue;
    await db.taskExecution.updateMany({
      where: { taskId: task.id, organizationId, status: "Running" },
      data: { status: "Failed", error: "Execution interrupted. Retry this task.", completedAt: new Date() },
    });
    await db.activityEvent.create({
      data: {
        organizationId,
        actorType: "system",
        action: "task.interrupted",
        entityType: "task",
        entityId: task.id,
        title: "Task run was interrupted",
      },
    });
  }
}

export async function runTask(organizationId: string, taskId: string) {
  const db = getPrisma();
  const task = await db.task.findFirst({
    where: { id: taskId, organizationId },
    include: { assignedEmployee: true, _count: { select: { executions: true } } },
  });
  if (!task) throw new WorkflowRunError("Task not found.", 404);
  if (!task.assignedEmployee || !task.assignedEmployee.enabled || task.assignedEmployee.status !== "Active") {
    throw new WorkflowRunError("The assigned AI employee is unavailable.", 422);
  }
  if (task.status !== "Queued" && task.status !== "Failed") {
    throw new WorkflowRunError("This task cannot be started from its current state.", 409);
  }
  const claimed = await db.task.updateMany({
    where: { id: taskId, organizationId, status: task.status },
    data: { status: "Running" },
  });
  if (!claimed.count) throw new WorkflowRunError("This task is already running.", 409);
  const execution = await db.taskExecution.create({
    data: {
      organizationId,
      taskId,
      employeeId: task.assignedEmployee.id,
      status: "Running",
      attempt: task._count.executions + 1,
      startedAt: new Date(),
    },
  });
  try {
    const result = await runWorkflowAgent({
      role: task.assignedEmployee.role,
      instructions: [task.assignedEmployee.instructions, task.title, task.description].filter(Boolean).join("\n"),
      context: { task: { id: task.id, title: task.title, description: task.description, priority: task.priority } },
    });
    await db.$transaction(async (tx) => {
      await tx.taskExecution.update({
        where: { id: execution.id },
        data: { status: "Completed", output: result, completedAt: new Date() },
      });
      await tx.task.update({
        where: { id: taskId },
        data: { status: "Completed", output: result, completedAt: new Date() },
      });
      await tx.activityEvent.create({
        data: {
          organizationId,
          actorType: "ai_employee",
          actorId: task.assignedEmployeeId,
          action: "task.completed",
          entityType: "task",
          entityId: taskId,
          title: `${task.assignedEmployee?.name} completed ${task.title}`,
        },
      });
      if (result.inputTokens !== null && result.outputTokens !== null) {
        await tx.analyticsEvent.create({
          data: {
            organizationId,
            name: "ai.tokens.used",
            value: result.inputTokens + result.outputTokens,
            properties: { model: result.model, inputTokens: result.inputTokens, outputTokens: result.outputTokens },
          },
        });
      }
    });
  } catch (error) {
    const message = getWorkflowAgentError(error).slice(0, 500);
    await db.$transaction(async (tx) => {
      await tx.taskExecution.update({
        where: { id: execution.id },
        data: { status: "Failed", error: message, completedAt: new Date() },
      });
      await tx.task.update({ where: { id: taskId }, data: { status: "Failed" } });
      await tx.activityEvent.create({
        data: {
          organizationId,
          actorType: "system",
          action: "task.failed",
          entityType: "task",
          entityId: taskId,
          title: `${task.title} needs attention`,
        },
      });
    });
  }
  return db.task.findFirst({
    where: { id: taskId, organizationId },
    include: {
      assignedEmployee: { select: { id: true, name: true, role: true } },
      executions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}
