import { z } from "zod";
import { apiError, apiJson, readJson } from "@/lib/api/http";
import { assertSameOrigin, requireWorkspaceContext, requireWorkspaceRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

const createSchema = z.strictObject({
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().max(2_000).optional(),
});

export async function GET() {
  try {
    const context = await requireWorkspaceContext();
    const workflows = await getPrisma().workflow.findMany({
      where: { organizationId: context.organization.id, status: { not: "Archived" } },
      include: {
        nodes: { orderBy: { positionX: "asc" } },
        edges: true,
        executions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    return apiJson({ workflows });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await requireWorkspaceContext();
    requireWorkspaceRole(context.role, ["Owner", "Admin", "Manager"]);
    const input = createSchema.parse(await readJson(request));
    const workflow = await getPrisma().workflow.create({
      data: {
        organizationId: context.organization.id,
        createdById: context.user.id,
        name: input.name,
        description: input.description,
        status: "Draft",
        enabled: false,
        nodes: {
          create: [
            { key: "start", type: "START", title: "Start", positionX: 0, positionY: 0 },
            { key: "end", type: "END", title: "Complete", positionX: 240, positionY: 0 },
          ],
        },
        edges: { create: [{ sourceKey: "start", targetKey: "end" }] },
      },
      include: { nodes: true, edges: true },
    });
    await getPrisma().auditLog.create({
      data: {
        organizationId: context.organization.id,
        actorUserId: context.user.id,
        action: "workflow.created",
        entityType: "workflow",
        entityId: workflow.id,
      },
    });
    return apiJson({ workflow }, 201);
  } catch (error) {
    return apiError(error);
  }
}
