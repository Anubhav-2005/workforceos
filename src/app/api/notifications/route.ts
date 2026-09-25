import { z } from "zod";
import { apiError, apiJson, readJson } from "@/lib/api/http";
import { assertSameOrigin, requireWorkspaceContext } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

const markSchema = z.strictObject({ all: z.boolean().optional(), ids: z.array(z.string()).max(100).optional() });

export async function GET() {
  try {
    const context = await requireWorkspaceContext();
    const notifications = await getPrisma().notification.findMany({
      where: { organizationId: context.organization.id, userId: context.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return apiJson({ notifications, unread: notifications.filter((item) => !item.readAt).length });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await requireWorkspaceContext();
    const input = markSchema.parse(await readJson(request));
    if (!input.all && !input.ids?.length) return apiJson({ error: "Select notifications to mark as read." }, 400);
    const result = await getPrisma().notification.updateMany({
      where: {
        organizationId: context.organization.id,
        userId: context.user.id,
        readAt: null,
        ...(input.all ? {} : { id: { in: input.ids } }),
      },
      data: { readAt: new Date() },
    });
    return apiJson({ updated: result.count });
  } catch (error) {
    return apiError(error);
  }
}
