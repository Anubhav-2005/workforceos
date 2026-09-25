import { apiError, apiJson } from "@/lib/api/http";
import { assertSameOrigin, requireWorkspaceContext, requireWorkspaceRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const context = await requireWorkspaceContext();
    const { id } = await params;
    const task = await getPrisma().task.findFirst({
      where: { id, organizationId: context.organization.id },
      include: {
        assignedEmployee: { select: { id: true, name: true, role: true } },
        executions: { orderBy: { createdAt: "desc" } },
      },
    });
    return task ? apiJson({ task }) : apiJson({ error: "Task not found." }, 404);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    assertSameOrigin(request);
    const context = await requireWorkspaceContext();
    requireWorkspaceRole(context.role, ["Owner", "Admin", "Manager"]);
    const { id } = await params;
    const db = getPrisma();
    const updated = await db.task.updateMany({
      where: { id, organizationId: context.organization.id, status: { in: ["Backlog", "Queued", "Failed"] } },
      data: { status: "Cancelled" },
    });
    if (!updated.count) return apiJson({ error: "This task cannot be cancelled now." }, 409);
    await db.auditLog.create({
      data: {
        organizationId: context.organization.id,
        actorUserId: context.user.id,
        action: "task.cancelled",
        entityType: "task",
        entityId: id,
      },
    });
    return apiJson({ cancelled: true });
  } catch (error) {
    return apiError(error);
  }
}
