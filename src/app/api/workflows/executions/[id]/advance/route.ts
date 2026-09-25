import { apiError, apiJson } from "@/lib/api/http";
import { assertSameOrigin, requireWorkspaceContext, requireWorkspaceRole } from "@/lib/auth/session";
import { advanceWorkflowRun } from "@/lib/workflows/runner";

export const runtime = "nodejs";
export const maxDuration = 60;
type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    assertSameOrigin(request);
    const context = await requireWorkspaceContext();
    requireWorkspaceRole(context.role, ["Owner", "Admin", "Manager", "Member"]);
    const { id } = await params;
    return apiJson({ execution: await advanceWorkflowRun(context.organization.id, id) });
  } catch (error) {
    return apiError(error);
  }
}
