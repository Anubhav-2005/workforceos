import { z } from "zod";
import { apiError, apiJson, readJson } from "@/lib/api/http";
import { assertSameOrigin, requireWorkspaceContext, requireWorkspaceRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.strictObject({ name: z.string().trim().min(2).max(120) });

export async function GET() {
  try {
    const context = await requireWorkspaceContext();
    const workspace = await getPrisma().organization.findUnique({
      where: { id: context.organization.id },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });
    return apiJson({ workspace, role: context.role, user: context.user });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await requireWorkspaceContext();
    requireWorkspaceRole(context.role, ["Owner", "Admin"]);
    const input = schema.parse(await readJson(request));
    const workspace = await getPrisma().$transaction(async (tx) => {
      const updated = await tx.organization.update({
        where: { id: context.organization.id },
        data: { name: input.name },
      });
      await tx.auditLog.create({
        data: {
          organizationId: context.organization.id,
          actorUserId: context.user.id,
          action: "workspace.renamed",
          entityType: "organization",
          entityId: context.organization.id,
          before: { name: context.organization.name },
          after: { name: input.name },
        },
      });
      return updated;
    });
    return apiJson({ workspace });
  } catch (error) {
    return apiError(error);
  }
}
