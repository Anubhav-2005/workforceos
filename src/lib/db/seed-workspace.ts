import "server-only";

import type { Prisma } from "@prisma/client";

type StarterEmployeeKey = "maya" | "alex" | "nova" | "atlas" | "iris";

/** Creates templates only; no invented activity, candidates, or completed work. */
export async function createStarterWorkspaceData(
  tx: Prisma.TransactionClient,
  organizationId: string,
  userId: string,
): Promise<{ employeeIds: Record<StarterEmployeeKey, string>; workflowId: string }> {
  const templates = [
    {
      key: "maya" as const,
      name: "Maya",
      role: "Recruiter",
      department: "Talent",
      description: "Reviews resumes and prepares evidence for human hiring decisions.",
      instructions: "Analyze candidate evidence objectively. Surface uncertainty and request a human decision.",
    },
    {
      key: "alex" as const,
      name: "Alex",
      role: "Sales Development",
      department: "Revenue",
      description: "Prepares outreach and onboarding drafts for human review.",
      instructions: "Draft concise, accurate communication. Never claim that a message was sent.",
    },
    {
      key: "nova" as const,
      name: "Nova",
      role: "Customer Support",
      department: "Support",
      description: "Prepares customer support responses and welcome materials.",
      instructions: "Draft helpful support content with clear escalation when uncertain.",
    },
    {
      key: "atlas" as const,
      name: "Atlas",
      role: "Research Analyst",
      department: "Research",
      description: "Organizes research findings and source notes.",
      instructions: "Separate verified facts from assumptions and cite available sources.",
    },
    {
      key: "iris" as const,
      name: "Iris",
      role: "Operations",
      department: "Operations",
      description: "Coordinates tasks and flags operational exceptions.",
      instructions: "Track work accurately and escalate consequential actions for human approval.",
    },
  ];

  const employeeIds = {} as Record<StarterEmployeeKey, string>;
  for (const template of templates) {
    const employee = await tx.aIEmployee.create({
      data: {
        organizationId,
        slug: template.key,
        name: template.name,
        role: template.role,
        department: template.department,
        description: template.description,
        instructions: template.instructions,
      },
    });
    employeeIds[template.key] = employee.id;
  }

  const workflow = await tx.workflow.create({
    data: {
      organizationId,
      createdById: userId,
      name: "Candidate onboarding",
      description: "Analyze a candidate, request a human decision, and prepare an onboarding draft.",
      status: "Active",
      enabled: true,
    },
  });

  await tx.workflowNode.createMany({
    data: [
      { workflowId: workflow.id, key: "start", type: "START", title: "Resume received", positionX: 0, positionY: 0 },
      {
        workflowId: workflow.id,
        key: "recruiter",
        type: "AI_EMPLOYEE",
        title: "Maya reviews analysis",
        positionX: 220,
        positionY: 0,
        employeeId: employeeIds.maya,
        config: { mode: "use_existing_analysis" },
      },
      {
        workflowId: workflow.id,
        key: "approval",
        type: "HUMAN_APPROVAL",
        title: "Human approval",
        positionX: 440,
        positionY: 0,
        config: { action: "Approve candidate onboarding" },
      },
      {
        workflowId: workflow.id,
        key: "sales",
        type: "AI_EMPLOYEE",
        title: "Alex prepares email",
        positionX: 660,
        positionY: 0,
        employeeId: employeeIds.alex,
        config: { instructions: "Prepare a concise onboarding email draft for human review." },
      },
      {
        workflowId: workflow.id,
        key: "save_draft",
        type: "ACTION",
        title: "Save draft",
        positionX: 880,
        positionY: 0,
        config: { action: "save_draft" },
      },
      { workflowId: workflow.id, key: "end", type: "END", title: "Complete", positionX: 1100, positionY: 0 },
    ],
  });

  await tx.workflowEdge.createMany({
    data: [
      { workflowId: workflow.id, sourceKey: "start", targetKey: "recruiter" },
      { workflowId: workflow.id, sourceKey: "recruiter", targetKey: "approval" },
      { workflowId: workflow.id, sourceKey: "approval", targetKey: "sales" },
      { workflowId: workflow.id, sourceKey: "sales", targetKey: "save_draft" },
      { workflowId: workflow.id, sourceKey: "save_draft", targetKey: "end" },
    ],
  });

  return { employeeIds, workflowId: workflow.id };
}
