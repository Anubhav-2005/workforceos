import { z } from "zod";
import { apiError, apiJson, readJson } from "@/lib/api/http";
import { assertSameOrigin, requireWorkspaceContext, requireWorkspaceRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";
import { recoverStaleTasks } from "@/lib/tasks/run";

export const runtime = "nodejs";
const createSchema = z.strictObject({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(10_000).optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium"),
  assignedEmployeeId: z.string().min(1),
  dueAt: z.iso.datetime().optional(),
});

export async function GET(request: Request) {
  try {
    const context = await requireWorkspaceContext();
    await recoverStaleTasks(context.organization.id);
    const params = new URL(request.url).searchParams;
    const status = params.get("status");
    const tasks = await getPrisma().task.findMany({
      where: {
        organizationId: context.organization.id,
        ...(status &&
        ["Backlog", "Queued", "Running", "NeedsApproval", "Completed", "Failed", "Cancelled"].includes(status)
          ? {
              status: status as
                "Backlog" | "Queued" | "Running" | "NeedsApproval" | "Completed" | "Failed" | "Cancelled",
            }
          : {}),
      },
      include: {
        assignedEmployee: { select: { id: true, name: true, role: true } },
        executions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return apiJson({ tasks });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await requireWorkspaceContext();
    requireWorkspaceRole(context.role, ["Owner", "Admin", "Manager", "Member"]);
    const input = createSchema.parse(await readJson(request));
    const db = getPrisma();
    const employee = await db.aIEmployee.findFirst({
      where: { id: input.assignedEmployeeId, organizationId: context.organization.id, enabled: true, status: "Active" },
    });
    if (!employee) return apiJson({ error: "Choose an active employee in this workspace." }, 422);
    const task = await db.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          organizationId: context.organization.id,
          title: input.title,
          description: input.description,
          priority: input.priority,
          assignedEmployeeId: employee.id,
          createdById: context.user.id,
          dueAt: input.dueAt ? new Date(input.dueAt) : null,
          status: "Queued",
        },
      });
      await tx.activityEvent.create({
        data: {
          organizationId: context.organization.id,
          actorType: "user",
          actorId: context.user.id,
          action: "task.created",
          entityType: "task",
          entityId: created.id,
          title: `${created.title} assigned to ${employee.name}`,
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: context.organization.id,
          actorUserId: context.user.id,
          action: "task.created",
          entityType: "task",
          entityId: created.id,
        },
      });
      return created;
    });
    return apiJson({ task }, 201);
  } catch (error) {
    return apiError(error);
  }
}
