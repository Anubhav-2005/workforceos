import "server-only";
import { createHash } from "node:crypto";
import type { RecruiterAnalysisResult } from "@/lib/ai/analyzeRecruiterResume";
import { getPrisma } from "@/lib/db";

/** Stores analysis and review state; the raw PDF is discarded after extraction. */
export async function persistRecruiterAnalysis(input: {
  organizationId: string;
  userId: string;
  file: File;
  result: RecruiterAnalysisResult;
}): Promise<string> {
  const db = getPrisma();
  const { analysis } = input.result;
  const digest = createHash("sha256")
    .update(Buffer.from(await input.file.arrayBuffer()))
    .digest("hex");
  const recruiter = await db.aIEmployee.findFirst({
    where: { organizationId: input.organizationId, slug: { in: ["maya", "recruiter"] } },
    select: { id: true },
  });
  const reviewerIds = await db.organizationMember.findMany({
    where: { organizationId: input.organizationId, role: { in: ["Owner", "Admin", "Manager"] } },
    select: { userId: true },
  });

  const candidate = await db.$transaction(async (tx) => {
    const email = analysis.email.trim().toLowerCase();
    const existing = email
      ? await tx.candidate.findFirst({
          where: { organizationId: input.organizationId, email },
          orderBy: { createdAt: "desc" },
        })
      : null;
    const record = existing
      ? await tx.candidate.update({
          where: { id: existing.id },
          data: {
            name: analysis.candidateName || existing.name,
            phone: analysis.phone || existing.phone,
            currentRole: analysis.currentRole || existing.currentRole,
            location: analysis.location || existing.location,
            yearsExperience: analysis.yearsExperience,
            aiScore: analysis.score,
            status: "ReviewRequired",
            recruiterEmployeeId: recruiter?.id ?? null,
          },
        })
      : await tx.candidate.create({
          data: {
            organizationId: input.organizationId,
            name: analysis.candidateName || "Unnamed candidate",
            email: email || null,
            phone: analysis.phone || null,
            currentRole: analysis.currentRole || null,
            location: analysis.location || null,
            yearsExperience: analysis.yearsExperience,
            aiScore: analysis.score,
            status: "ReviewRequired",
            recruiterEmployeeId: recruiter?.id ?? null,
          },
        });
    const upload = await tx.fileUpload.create({
      data: {
        organizationId: input.organizationId,
        uploadedById: input.userId,
        candidateId: record.id,
        filename: input.file.name.slice(0, 255),
        mimeType: "application/pdf",
        sizeBytes: input.file.size,
        sha256: digest,
        status: "processed_without_raw_file_retention",
      },
    });
    await tx.resumeAnalysis.create({
      data: {
        organizationId: input.organizationId,
        candidateId: record.id,
        employeeId: recruiter?.id ?? null,
        fileUploadId: upload.id,
        model: input.result.model,
        promptVersion: input.result.promptVersion,
        result: analysis,
        score: analysis.score,
        decision: analysis.decision,
        source: "openai",
      },
    });
    await tx.approval.create({
      data: {
        organizationId: input.organizationId,
        candidateId: record.id,
        requestingEmployeeId: recruiter?.id ?? null,
        action: `Review ${record.name}'s application`,
        reason: analysis.reasoning.slice(0, 1_000),
        evidence: { score: analysis.score, recommendation: analysis.decision },
        risk: "High",
      },
    });
    await tx.activityEvent.create({
      data: {
        organizationId: input.organizationId,
        actorType: "ai_employee",
        actorId: recruiter?.id ?? null,
        action: "candidate.analyzed",
        entityType: "candidate",
        entityId: record.id,
        title: `${record.name}'s resume was analyzed`,
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorUserId: input.userId,
        action: "candidate.analysis.created",
        entityType: "candidate",
        entityId: record.id,
      },
    });
    if (reviewerIds.length) {
      await tx.notification.createMany({
        data: reviewerIds.map(({ userId }) => ({
          organizationId: input.organizationId,
          userId,
          type: "approval.requested",
          title: `${record.name} is ready for review`,
          href: `/dashboard/employees/recruiter?candidate=${record.id}`,
        })),
      });
    }
    if (input.result.usage) {
      await tx.analyticsEvent.create({
        data: {
          organizationId: input.organizationId,
          name: "ai.tokens.used",
          value: input.result.usage.totalTokens,
          properties: {
            model: input.result.model,
            inputTokens: input.result.usage.inputTokens,
            outputTokens: input.result.usage.outputTokens,
          },
        },
      });
    }
    return record;
  });
  return candidate.id;
}
