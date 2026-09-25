import { z } from "zod";
import { apiError, apiJson, readJson } from "@/lib/api/http";
import { assertSameOrigin, requireWorkspaceContext, requireWorkspaceRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";
import { WorkflowRunError } from "@/lib/workflows/runner";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };

const patchSchema = z.strictObject({
  status: z
    .enum([
      "New",
      "Analyzed",
      "ReviewRequired",
      "InterviewRequested",
      "Interviewing",
      "Approved",
      "Rejected",
      "Onboarding",
      "Hired",
    ])
    .optional(),
  notes: z.string().trim().max(10_000).nullable().optional(),
});

export async function GET(_request: Request, { params }: Params) {
  try {
    const context = await requireWorkspaceContext();
    const { id } = await params;
    const candidate = await getPrisma().candidate.findFirst({
      where: { id, organizationId: context.organization.id },
      include: {
        analyses: { orderBy: { createdAt: "desc" } },
        approvals: { orderBy: { requestedAt: "desc" }, include: { reviewer: { select: { id: true, name: true } } } },
        files: { select: { id: true, filename: true, sizeBytes: true, sha256: true, createdAt: true } },
      },
    });
    return candidate ? apiJson({ candidate }) : apiJson({ error: "Candidate not found." }, 404);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    assertSameOrigin(request);
    const context = await requireWorkspaceContext();
    requireWorkspaceRole(context.role, ["Owner", "Admin", "Manager"]);
    const { id } = await params;
    const input = patchSchema.parse(await readJson(request));
    const db = getPrisma();
    const exists = await db.candidate.findFirst({ where: { id, organizationId: context.organization.id } });
    if (!exists) return apiJson({ error: "Candidate not found." }, 404);
    const candidate = await db.$transaction(async (tx) => {
      const updated = await tx.candidate.update({ where: { id }, data: input });
      await tx.auditLog.create({
        data: {
          organizationId: context.organization.id,
          actorUserId: context.user.id,
          action: "candidate.updated",
          entityType: "candidate",
          entityId: id,
          before: { status: exists.status },
          after: { status: updated.status },
        },
      });
      return updated;
    });
    return apiJson({ candidate });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    assertSameOrigin(request);
    const context = await requireWorkspaceContext();
    requireWorkspaceRole(context.role, ["Owner", "Admin"]);
    const { id } = await params;
    const db = getPrisma();
    const deleted = await db.$transaction(async (tx) => {
      const existing = await tx.candidate.findFirst({ where: { id, organizationId: context.organization.id } });
      if (!existing) return false;
      const linkedRuns = await tx.workflowExecution.findMany({
        where: { organizationId: context.organization.id, input: { path: ["candidateId"], equals: id } },
        select: { id: true, status: true },
      });
      if (linkedRuns.some((run) => ["Queued", "Running", "WaitingForApproval"].includes(run.status))) {
        throw new WorkflowRunError(
          "Finish or cancel this candidate's active workflow before deleting their data.",
          409,
        );
      }
      const runIds = linkedRuns.map((run) => run.id);
      const linkedApprovals = await tx.approval.findMany({
        where: {
          organizationId: context.organization.id,
          OR: [{ candidateId: id }, ...(runIds.length ? [{ workflowExecutionId: { in: runIds } }] : [])],
        },
        select: { id: true },
      });
      const notificationLinks = [
        ...linkedApprovals.map((approval) => `/dashboard/approvals?approval=${approval.id}`),
        ...runIds.map((runId) => `/dashboard/workflows?run=${runId}`),
      ];
      await tx.notification.deleteMany({
        where: {
          organizationId: context.organization.id,
          OR: [{ href: { contains: `candidate=${id}` } }, { href: { in: notificationLinks } }],
        },
      });
      if (runIds.length) {
        await tx.approval.deleteMany({
          where: { organizationId: context.organization.id, workflowExecutionId: { in: runIds } },
        });
        await tx.activityEvent.deleteMany({
          where: { organizationId: context.organization.id, entityType: "workflowExecution", entityId: { in: runIds } },
        });
        await tx.auditLog.deleteMany({
          where: { organizationId: context.organization.id, entityType: "workflowExecution", entityId: { in: runIds } },
        });
        await tx.workflowExecution.deleteMany({
          where: { organizationId: context.organization.id, id: { in: runIds } },
        });
      }
      await tx.approval.deleteMany({ where: { organizationId: context.organization.id, candidateId: id } });
      await tx.fileUpload.deleteMany({ where: { organizationId: context.organization.id, candidateId: id } });
      await tx.activityEvent.deleteMany({
        where: { organizationId: context.organization.id, entityType: "candidate", entityId: id },
      });
      await tx.auditLog.deleteMany({
        where: { organizationId: context.organization.id, entityType: "candidate", entityId: id },
      });
      await tx.candidate.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          organizationId: context.organization.id,
          actorUserId: context.user.id,
          action: "candidate.deleted",
          entityType: "candidate",
          entityId: id,
        },
      });
      return true;
    });
    return deleted ? new Response(null, { status: 204 }) : apiJson({ error: "Candidate not found." }, 404);
  } catch (error) {
    return apiError(error);
  }
}
