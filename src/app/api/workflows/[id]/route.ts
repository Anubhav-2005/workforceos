import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { apiError, apiJson, readJson } from "@/lib/api/http";
import { assertSameOrigin, requireWorkspaceContext, requireWorkspaceRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";
import { InvalidWorkflowError, validateWorkflowGraph, workflowNodeTypes } from "@/lib/workflows/graph";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };

const nodeSchema = z.strictObject({
  key: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/),
  type: z.enum(workflowNodeTypes),
  title: z.string().trim().min(1).max(160),
  positionX: z.number().finite().default(0),
  positionY: z.number().finite().default(0),
  employeeId: z.string().nullable().optional(),
  config: z.record(z.string(), z.unknown()).default({}),
});
const edgeSchema = z.strictObject({
  sourceKey: z.string(),
  targetKey: z.string(),
  condition: z.boolean().nullable().optional(),
});
const patchSchema = z.strictObject({
  name: z.string().trim().min(2).max(180).optional(),
  description: z.string().trim().max(2_000).nullable().optional(),
  enabled: z.boolean().optional(),
  graph: z.strictObject({ nodes: z.array(nodeSchema), edges: z.array(edgeSchema) }).optional(),
});

export async function GET(_request: Request, { params }: Params) {
  try {
    const context = await requireWorkspaceContext();
    const { id } = await params;
    const workflow = await getPrisma().workflow.findFirst({
      where: { id, organizationId: context.organization.id, status: { not: "Archived" } },
      include: { nodes: true, edges: true, executions: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
    return workflow ? apiJson({ workflow }) : apiJson({ error: "Workflow not found." }, 404);
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
    const existing = await db.workflow.findFirst({
      where: { id, organizationId: context.organization.id, status: { not: "Archived" } },
      include: { nodes: true, edges: true },
    });
    if (!existing) return apiJson({ error: "Workflow not found." }, 404);

    const graph = input.graph ?? {
      nodes: existing.nodes.map((node) => ({
        key: node.key,
        type: node.type,
        title: node.title,
        positionX: node.positionX,
        positionY: node.positionY,
        employeeId: node.employeeId,
        config: asConfig(node.config),
      })),
      edges: existing.edges.map((edge) => ({
        sourceKey: edge.sourceKey,
        targetKey: edge.targetKey,
        condition: asCondition(edge.condition),
      })),
    };
    if (input.enabled === true || existing.enabled) {
      validateWorkflowGraph(graph);
      for (const node of graph.nodes) {
        if (node.type === "AI_EMPLOYEE" && !node.employeeId) {
          throw new InvalidWorkflowError(`${node.title} needs an assigned AI employee.`);
        }
        if (node.type === "ACTION" && node.config.action !== "save_draft") {
          throw new InvalidWorkflowError("Only the internal save draft action is currently available.");
        }
      }
      const employeeIds = [
        ...new Set(graph.nodes.map((node) => node.employeeId).filter((id): id is string => Boolean(id))),
      ];
      if (employeeIds.length) {
        const count = await db.aIEmployee.count({
          where: { id: { in: employeeIds }, organizationId: context.organization.id },
        });
        if (count !== employeeIds.length)
          throw new InvalidWorkflowError("A node uses an employee outside this workspace.");
      }
    }

    const workflow = await db.$transaction(async (tx) => {
      if (input.graph) {
        await tx.workflowEdge.deleteMany({ where: { workflowId: id } });
        await tx.workflowNode.deleteMany({ where: { workflowId: id } });
        await tx.workflowNode.createMany({
          data: graph.nodes.map((node) => ({
            workflowId: id,
            key: node.key,
            type: node.type,
            title: node.title,
            positionX: node.positionX,
            positionY: node.positionY,
            employeeId: node.employeeId,
            config: node.config as Prisma.InputJsonValue,
          })),
        });
        await tx.workflowEdge.createMany({
          data: graph.edges.map((edge) => ({
            workflowId: id,
            sourceKey: edge.sourceKey,
            targetKey: edge.targetKey,
            condition: edge.condition === undefined ? undefined : { value: edge.condition },
          })),
        });
      }
      const updated = await tx.workflow.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          enabled: input.enabled,
          status: input.enabled === undefined ? undefined : input.enabled ? "Active" : "Draft",
          definitionVersion: input.graph ? { increment: 1 } : undefined,
        },
        include: { nodes: true, edges: true },
      });
      await tx.auditLog.create({
        data: {
          organizationId: context.organization.id,
          actorUserId: context.user.id,
          action: "workflow.updated",
          entityType: "workflow",
          entityId: id,
        },
      });
      return updated;
    });
    return apiJson({ workflow });
  } catch (error) {
    if (error instanceof InvalidWorkflowError) return apiJson({ error: error.message }, 422);
    return apiError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    assertSameOrigin(request);
    const context = await requireWorkspaceContext();
    requireWorkspaceRole(context.role, ["Owner", "Admin", "Manager"]);
    const { id } = await params;
    const db = getPrisma();
    const updated = await db.workflow.updateMany({
      where: { id, organizationId: context.organization.id, status: { not: "Archived" } },
      data: { status: "Archived", enabled: false },
    });
    if (!updated.count) return apiJson({ error: "Workflow not found." }, 404);
    await db.auditLog.create({
      data: {
        organizationId: context.organization.id,
        actorUserId: context.user.id,
        action: "workflow.archived",
        entityType: "workflow",
        entityId: id,
      },
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}

function asConfig(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}
function asCondition(value: unknown): boolean | null {
  const config = asConfig(value);
  return typeof config.value === "boolean" ? config.value : null;
}
