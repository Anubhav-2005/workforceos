import type { CandidateStatus, Prisma } from "@prisma/client";
import { apiError, apiJson } from "@/lib/api/http";
import { requireWorkspaceContext } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

const statuses: CandidateStatus[] = [
  "New",
  "Analyzed",
  "ReviewRequired",
  "InterviewRequested",
  "Interviewing",
  "Approved",
  "Rejected",
  "Onboarding",
  "Hired",
];

export async function GET(request: Request) {
  try {
    const context = await requireWorkspaceContext();
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Math.min(1_000, Number(params.get("page") ?? 1) || 1));
    const limit = Math.max(1, Math.min(50, Number(params.get("limit") ?? 20) || 20));
    const search = params.get("search")?.trim().slice(0, 120) || null;
    const rawStatus = params.get("status");
    const pendingApprovalOnly = params.get("approvalStatus") === "Pending";
    const scoreFrom = params.get("scoreFrom");
    const scoreTo = params.get("scoreTo");
    const since = params.get("since");
    const where: Prisma.CandidateWhereInput = {
      organizationId: context.organization.id,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { currentRole: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(rawStatus && statuses.includes(rawStatus as CandidateStatus) ? { status: rawStatus as CandidateStatus } : {}),
      ...(pendingApprovalOnly ? { approvals: { some: { status: "Pending" } }, analyses: { some: {} } } : {}),
      ...(scoreFrom || scoreTo
        ? {
            aiScore: {
              ...(scoreFrom && Number.isFinite(Number(scoreFrom)) ? { gte: Number(scoreFrom) } : {}),
              ...(scoreTo && Number.isFinite(Number(scoreTo)) ? { lte: Number(scoreTo) } : {}),
            },
          }
        : {}),
      ...(since && !Number.isNaN(new Date(since).getTime()) ? { createdAt: { gte: new Date(since) } } : {}),
    };
    const sort = params.get("sort");
    const orderBy: Prisma.CandidateOrderByWithRelationInput =
      sort === "score" ? { aiScore: "desc" } : sort === "name" ? { name: "asc" } : { createdAt: "desc" };
    const [candidates, total] = await Promise.all([
      getPrisma().candidate.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          analyses: { orderBy: { createdAt: "desc" }, take: 1 },
          approvals: {
            ...(pendingApprovalOnly ? { where: { status: "Pending" as const } } : {}),
            orderBy: { requestedAt: "desc" },
            take: 1,
            select: { id: true, status: true, requestedAt: true },
          },
        },
      }),
      getPrisma().candidate.count({ where }),
    ]);
    return apiJson({ candidates, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    return apiError(error);
  }
}
