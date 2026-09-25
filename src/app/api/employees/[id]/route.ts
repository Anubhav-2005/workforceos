import { z } from "zod";
import { apiError, apiJson, readJson } from "@/lib/api/http";
import { assertSameOrigin, requireWorkspaceContext, requireWorkspaceRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };
const schema = z.strictObject({
  name: z.string().trim().min(2).max(120).optional(),
  role: z.string().trim().min(2).max(160).optional(),
  department: z.string().trim().max(120).nullable().optional(),
  description: z.string().trim().max(2_000).nullable().optional(),
  instructions: z.string().trim().max(8_000).nullable().optional(),
  model: z.string().trim().max(100).nullable().optional(),
  enabled: z.boolean().optional(),
  status: z.enum(["Active", "Paused", "Disabled"]).optional(),
});

export async function GET(_request: Request, { params }: Params) {
  try {
    const context = await requireWorkspaceContext();
    const { id } = await params;
    const employee = await getPrisma().aIEmployee.findFirst({
      where: { id, organizationId: context.organization.id },
      include: {
        tools: true,
        tasks: { orderBy: { createdAt: "desc" }, take: 30 },
        taskExecutions: { orderBy: { createdAt: "desc" }, take: 30 },
      },
    });
    return employee ? apiJson({ employee }) : apiJson({ error: "AI employee not found." }, 404);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    assertSameOrigin(request);
    const context = await requireWorkspaceContext();
    requireWorkspaceRole(context.role, ["Owner", "Admin", "Manager"]);
    const { id } = await params;
    const input = schema.parse(await readJson(request));
    const db = getPrisma();
    const exists = await db.aIEmployee.findFirst({ where: { id, organizationId: context.organization.id } });
    if (!exists) return apiJson({ error: "AI employee not found." }, 404);
    const employee = await db.$transaction(async (tx) => {
      const updated = await tx.aIEmployee.update({ where: { id }, data: input });
      await tx.auditLog.create({
        data: {
          organizationId: context.organization.id,
          actorUserId: context.user.id,
          action: updated.enabled ? "employee.updated" : "employee.disabled",
          entityType: "aiEmployee",
          entityId: id,
        },
      });
      return updated;
    });
    return apiJson({ employee });
  } catch (error) {
    return apiError(error);
  }
}
