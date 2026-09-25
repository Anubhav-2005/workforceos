import { apiError, apiJson } from "@/lib/api/http";
import { requireWorkspaceContext } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await requireWorkspaceContext();
    const rawDays = Number(new URL(request.url).searchParams.get("days") ?? 30);
    const days = [7, 30, 90].includes(rawDays) ? rawDays : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1_000);
    const organizationId = context.organization.id;
    const db = getPrisma();
    const [
      activeEmployees,
      tasksCompleted,
      workflowRuns,
      completedRuns,
      failedRuns,
      approvals,
      approvedCount,
      executions,
      successfulExecutions,
      usage,
      completedTasks,
    ] = await Promise.all([
      db.aIEmployee.count({ where: { organizationId, enabled: true, status: "Active" } }),
      db.task.count({ where: { organizationId, status: "Completed", completedAt: { gte: since } } }),
      db.workflowExecution.count({ where: { organizationId, createdAt: { gte: since } } }),
      db.workflowExecution.count({ where: { organizationId, status: "Completed", createdAt: { gte: since } } }),
      db.workflowExecution.count({ where: { organizationId, status: "Failed", createdAt: { gte: since } } }),
      db.approval.findMany({
        where: { organizationId, requestedAt: { gte: since }, decidedAt: { not: null } },
        select: { requestedAt: true, decidedAt: true, status: true },
      }),
      db.approval.count({ where: { organizationId, status: "Approved", decidedAt: { gte: since } } }),
      db.taskExecution.count({ where: { organizationId, createdAt: { gte: since } } }),
      db.taskExecution.count({ where: { organizationId, status: "Completed", createdAt: { gte: since } } }),
      db.analyticsEvent.aggregate({
        where: { organizationId, name: "ai.tokens.used", createdAt: { gte: since } },
        _sum: { value: true },
      }),
      db.task.findMany({
        where: { organizationId, status: "Completed", completedAt: { gte: since } },
        select: { completedAt: true },
        take: 10_000,
      }),
    ]);
    const responseTimes = approvals
      .map((item) => item.decidedAt!.getTime() - item.requestedAt.getTime())
      .filter((value) => value >= 0);
    const approvalResponseMinutes = responseTimes.length
      ? Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length / 60_000)
      : null;
    const dailyCompleted = Array.from({ length: 7 }, (_, index) => {
      const start = new Date(since.getTime() + ((index * days) / 7) * 24 * 60 * 60 * 1_000);
      const end = new Date(since.getTime() + (((index + 1) * days) / 7) * 24 * 60 * 60 * 1_000);
      return {
        label: days === 7 ? start.toLocaleDateString("en-US", { weekday: "short" }) : `Period ${index + 1}`,
        count: completedTasks.filter((task) => task.completedAt && task.completedAt >= start && task.completedAt < end)
          .length,
      };
    });
    return apiJson({
      days,
      dailyCompleted,
      metrics: {
        activeEmployees,
        tasksCompleted,
        workflowRuns,
        completedRuns,
        failedRuns,
        workflowSuccessRate: workflowRuns ? Math.round((completedRuns / workflowRuns) * 100) : 0,
        approvals: approvals.length,
        approvedCount,
        approvalResponseMinutes,
        aiExecutions: executions,
        aiSuccessRate: executions ? Math.round((successfulExecutions / executions) * 100) : 0,
        tokensUsed: usage._sum.value ?? 0,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
