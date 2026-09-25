import { apiError, apiJson } from "@/lib/api/http";
import { requireWorkspaceContext } from "@/lib/auth/session";
import { getWorkflowRun } from "@/lib/workflows/runner";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const context = await requireWorkspaceContext();
    const { id } = await params;
    const execution = await getWorkflowRun(context.organization.id, id);
    return execution ? apiJson({ execution }) : apiJson({ error: "Workflow run not found." }, 404);
  } catch (error) {
    return apiError(error);
  }
}
