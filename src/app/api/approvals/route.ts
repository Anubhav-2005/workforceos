import { apiError, apiJson } from "@/lib/api/http";
import { requireWorkspaceContext } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await requireWorkspaceContext();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const approvals = await getPrisma().approval.findMany({
      where: {
        organizationId: context.organization.id,
        ...(status && ["Pending", "Approved", "Rejected", "Expired", "Cancelled"].includes(status)
          ? { status: status as "Pending" | "Approved" | "Rejected" | "Expired" | "Cancelled" }
          : {}),
      },
      include: {
        candidate: { select: { id: true, name: true, currentRole: true, aiScore: true, status: true } },
        requestingEmployee: { select: { id: true, name: true, role: true } },
        reviewer: { select: { id: true, name: true } },
        workflowExecution: { select: { id: true, status: true, workflowId: true } },
      },
      orderBy: { requestedAt: "desc" },
      take: 100,
    });
    return apiJson({ approvals });
  } catch (error) {
    return apiError(error);
  }
}
