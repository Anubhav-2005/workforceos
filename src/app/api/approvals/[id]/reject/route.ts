import { z } from "zod";
import { apiError, apiJson, readJson } from "@/lib/api/http";
import { assertSameOrigin, requireWorkspaceContext, requireWorkspaceRole } from "@/lib/auth/session";
import { decideApproval } from "@/lib/approvals/decide";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };
const schema = z.strictObject({ comment: z.string().trim().max(2_000).optional() });

export async function POST(request: Request, { params }: Params) {
  try {
    assertSameOrigin(request);
    const context = await requireWorkspaceContext();
    requireWorkspaceRole(context.role, ["Owner", "Admin", "Manager"]);
    const { id } = await params;
    const body = schema.parse(await readJson(request));
    const result = await decideApproval({
      organizationId: context.organization.id,
      approvalId: id,
      reviewerId: context.user.id,
      decision: "Rejected",
      comment: body.comment,
    });
    return apiJson({ approval: result });
  } catch (error) {
    return apiError(error);
  }
}
