import { z } from "zod";
import { apiError, apiJson, readJson } from "@/lib/api/http";
import { assertSameOrigin, requireWorkspaceContext, requireWorkspaceRole } from "@/lib/auth/session";
import { startWorkflowRun } from "@/lib/workflows/runner";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };
const schema = z.strictObject({ candidateId: z.string().min(1).optional() });

export async function POST(request: Request, { params }: Params) {
  try {
    assertSameOrigin(request);
    const context = await requireWorkspaceContext();
    requireWorkspaceRole(context.role, ["Owner", "Admin", "Manager", "Member"]);
    const { id } = await params;
    const input = schema.parse(await readJson(request));
    const execution = await startWorkflowRun({
      organizationId: context.organization.id,
      workflowId: id,
      userId: context.user.id,
      candidateId: input.candidateId,
    });
    return apiJson({ execution }, 201);
  } catch (error) {
    return apiError(error);
  }
}
