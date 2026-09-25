import "server-only";
import { getPrisma } from "@/lib/db";
import { decideWorkflowApproval, WorkflowRunError } from "@/lib/workflows/runner";

export async function decideApproval(input: {
  organizationId: string;
  approvalId: string;
  reviewerId: string;
  decision: "Approved" | "Rejected";
  comment?: string;
}) {
  const db = getPrisma();
  const approval = await db.approval.findFirst({
    where: { id: input.approvalId, organizationId: input.organizationId },
  });
  if (!approval) throw new WorkflowRunError("Approval not found.", 404);
  if (approval.workflowExecutionId) return decideWorkflowApproval(input);
  if (approval.status !== "Pending") throw new WorkflowRunError("This approval has already been decided.", 409);

  return db.$transaction(async (tx) => {
    const updated = await tx.approval.updateMany({
      where: { id: approval.id, organizationId: input.organizationId, status: "Pending" },
      data: {
        status: input.decision,
        reviewerId: input.reviewerId,
        reviewerComment: input.comment?.trim().slice(0, 2_000) || null,
        decidedAt: new Date(),
      },
    });
    if (updated.count !== 1) throw new WorkflowRunError("This approval has already been decided.", 409);
    if (approval.candidateId) {
      await tx.candidate.updateMany({
        where: { id: approval.candidateId, organizationId: input.organizationId },
        data: { status: input.decision },
      });
    }
    await tx.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorUserId: input.reviewerId,
        action: `approval.${input.decision.toLowerCase()}`,
        entityType: "approval",
        entityId: approval.id,
        before: { status: "Pending" },
        after: { status: input.decision },
      },
    });
    await tx.activityEvent.create({
      data: {
        organizationId: input.organizationId,
        actorType: "user",
        actorId: input.reviewerId,
        action: `approval.${input.decision.toLowerCase()}`,
        entityType: approval.candidateId ? "candidate" : "approval",
        entityId: approval.candidateId ?? approval.id,
        title: input.decision === "Approved" ? "Candidate approved for the next step" : "Candidate review rejected",
      },
    });
    return tx.approval.findUnique({ where: { id: approval.id } });
  });
}
