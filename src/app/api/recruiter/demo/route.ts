import { apiError, apiJson } from "@/lib/api/http";
import { assertSameOrigin, requireWorkspaceContext, requireWorkspaceRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";
import { demoRecruiterAnalysis } from "@/lib/recruiter-data";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await requireWorkspaceContext();
    requireWorkspaceRole(context.role, ["Owner", "Admin", "Manager", "Member"]);
    const db = getPrisma();
    const recruiter = await db.aIEmployee.findFirst({
      where: { organizationId: context.organization.id, slug: { in: ["maya", "recruiter"] } },
    });
    const candidate = await db.$transaction(async (tx) => {
      const created = await tx.candidate.create({
        data: {
          organizationId: context.organization.id,
          name: demoRecruiterAnalysis.candidateName,
          email: demoRecruiterAnalysis.email,
          phone: demoRecruiterAnalysis.phone,
          currentRole: demoRecruiterAnalysis.currentRole,
          yearsExperience: demoRecruiterAnalysis.yearsExperience,
          aiScore: demoRecruiterAnalysis.score,
          status: "ReviewRequired",
          recruiterEmployeeId: recruiter?.id ?? null,
        },
      });
      await tx.resumeAnalysis.create({
        data: {
          organizationId: context.organization.id,
          candidateId: created.id,
          employeeId: recruiter?.id ?? null,
          result: demoRecruiterAnalysis,
          score: demoRecruiterAnalysis.score,
          decision: demoRecruiterAnalysis.decision,
          source: "demo",
        },
      });
      await tx.approval.create({
        data: {
          organizationId: context.organization.id,
          candidateId: created.id,
          requestingEmployeeId: recruiter?.id ?? null,
          action: `Review fictional demo candidate ${created.name}`,
          reason: "Fictional demonstration result; no live AI request was made.",
          risk: "Low",
        },
      });
      await tx.activityEvent.create({
        data: {
          organizationId: context.organization.id,
          actorType: "user",
          actorId: context.user.id,
          action: "candidate.demo.created",
          entityType: "candidate",
          entityId: created.id,
          title: `Fictional demo candidate ${created.name} added`,
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: context.organization.id,
          actorUserId: context.user.id,
          action: "candidate.demo.created",
          entityType: "candidate",
          entityId: created.id,
        },
      });
      return created;
    });
    return apiJson({ candidate, analysis: demoRecruiterAnalysis, source: "demo" }, 201);
  } catch (error) {
    return apiError(error);
  }
}
