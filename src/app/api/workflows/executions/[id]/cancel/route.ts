import { apiError, apiJson } from "@/lib/api/http";
import { assertSameOrigin, requireWorkspaceContext, requireWorkspaceRole } from "@/lib/auth/session";
import { cancelWorkflowRun } from "@/lib/workflows/runner";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    assertSameOrigin(request);
    const context = await requireWorkspaceContext();
    requireWorkspaceRole(context.role, ["Owner", "Admin", "Manager"]);
    const { id } = await params;
    return apiJson({ execution: await cancelWorkflowRun(context.organization.id, id, context.user.id) });
  } catch (error) {
    return apiError(error);
  }
}
