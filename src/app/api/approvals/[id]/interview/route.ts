import { apiError, apiJson } from "@/lib/api/http";
import { assertSameOrigin, requireWorkspaceContext, requireWorkspaceRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";
import { WorkflowRunError } from "@/lib/workflows/runner";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    assertSameOrigin(request);
    const context = await requireWorkspaceContext();
    requireWorkspaceRole(context.role, ["Owner", "Admin", "Manager"]);
    const { id } = await params;
    const db = getPrisma();
    const approval = await db.approval.findFirst({ where: { id, organizationId: context.organization.id } });
    if (!approval?.candidateId || approval.workflowExecutionId) {
      throw new WorkflowRunError("Candidate approval not found.", 404);
    }
    const result = await db.$transaction(async (tx) => {
      const updated = await tx.approval.updateMany({
        where: { id, organizationId: context.organization.id, status: "Pending" },
        data: {
          status: "Approved",
          reviewerId: context.user.id,
          reviewerComment: "Interview requested",
          decidedAt: new Date(),
        },
      });
      if (!updated.count) throw new WorkflowRunError("This approval has already been decided.", 409);
      await tx.candidate.updateMany({
        where: { id: approval.candidateId!, organizationId: context.organization.id },
        data: { status: "InterviewRequested" },
      });
      await tx.auditLog.create({
        data: {
          organizationId: context.organization.id,
          actorUserId: context.user.id,
          action: "candidate.interview_requested",
          entityType: "candidate",
          entityId: approval.candidateId,
        },
      });
      await tx.activityEvent.create({
        data: {
          organizationId: context.organization.id,
          actorType: "user",
          actorId: context.user.id,
          action: "candidate.interview_requested",
          entityType: "candidate",
          entityId: approval.candidateId,
          title: "Candidate interview requested",
        },
      });
      return tx.approval.findUnique({ where: { id } });
    });
    return apiJson({ approval: result });
  } catch (error) {
    return apiError(error);
  }
}
