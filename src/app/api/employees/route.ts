import { z } from "zod";
import { apiError, apiJson, readJson } from "@/lib/api/http";
import { assertSameOrigin, requireWorkspaceContext, requireWorkspaceRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.strictObject({
  name: z.string().trim().min(2).max(120),
  role: z.string().trim().min(2).max(160),
  department: z.string().trim().max(120).optional(),
  description: z.string().trim().max(2_000).optional(),
  instructions: z.string().trim().max(8_000).optional(),
});

export async function GET() {
  try {
    const context = await requireWorkspaceContext();
    const employees = await getPrisma().aIEmployee.findMany({
      where: { organizationId: context.organization.id },
      include: { _count: { select: { tasks: true, taskExecutions: true } } },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    return apiJson({ employees });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await requireWorkspaceContext();
    requireWorkspaceRole(context.role, ["Owner", "Admin", "Manager"]);
    const input = schema.parse(await readJson(request));
    const slug = `${
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50) || "employee"
    }-${crypto.randomUUID().slice(0, 6)}`;
    const employee = await getPrisma().$transaction(async (tx) => {
      const created = await tx.aIEmployee.create({
        data: { organizationId: context.organization.id, slug, ...input },
      });
      await tx.auditLog.create({
        data: {
          organizationId: context.organization.id,
          actorUserId: context.user.id,
          action: "employee.created",
          entityType: "aiEmployee",
          entityId: created.id,
        },
      });
      return created;
    });
    return apiJson({ employee }, 201);
  } catch (error) {
    return apiError(error);
  }
}
