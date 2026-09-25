import { apiError, apiJson } from "@/lib/api/http";
import { requireWorkspaceContext } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const context = await requireWorkspaceContext();
    const organizationId = context.organization.id;
    const db = getPrisma();
    const reviewed = { organizationId, analyses: { some: {} } } as const;
    const approvedStatuses = ["Approved", "Hired", "Onboarding"] as const;
    const advancedStatuses = [...approvedStatuses, "InterviewRequested", "Interviewing"] as const;
    const decisionedStatuses = [...advancedStatuses, "Rejected"] as const;

    const [receivedCount, reviewedCount, pendingApprovalCount, decisionedCount, approvedCount, advancedCount, scores] =
      await Promise.all([
        db.candidate.count({ where: { organizationId } }),
        db.candidate.count({ where: reviewed }),
        db.candidate.count({
          where: { ...reviewed, status: "ReviewRequired", approvals: { some: { status: "Pending" } } },
        }),
        db.candidate.count({ where: { ...reviewed, status: { in: [...decisionedStatuses] } } }),
        db.candidate.count({ where: { ...reviewed, status: { in: [...approvedStatuses] } } }),
        db.candidate.count({ where: { ...reviewed, status: { in: [...advancedStatuses] } } }),
        db.candidate.aggregate({ where: reviewed, _avg: { aiScore: true } }),
      ]);

    return apiJson({
      metrics: {
        receivedCount,
        reviewedCount,
        pendingApprovalCount,
        decisionedCount,
        approvedCount,
        advancedCount,
        averageReviewedScore: Math.round(scores._avg.aiScore ?? 0),
        approvalRate: decisionedCount ? Math.round((approvedCount / decisionedCount) * 100) : 0,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
