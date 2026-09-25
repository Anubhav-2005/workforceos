import { apiError, apiJson } from "@/lib/api/http";
import { requireWorkspaceContext } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const context = await requireWorkspaceContext();
    const events = await getPrisma().activityEvent.findMany({
      where: { organizationId: context.organization.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return apiJson({ events });
  } catch (error) {
    return apiError(error);
  }
}
