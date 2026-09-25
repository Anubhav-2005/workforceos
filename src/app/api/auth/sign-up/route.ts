import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { z } from "zod";
import { apiError, apiJson, readJson } from "@/lib/api/http";
import { assertSameOrigin, createUserSession } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";
import { createStarterWorkspaceData } from "@/lib/db/seed-workspace";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const schema = z.strictObject({
  name: z.string().trim().min(2).max(120),
  email: z
    .email()
    .max(320)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  organizationName: z.string().trim().min(2).max(120),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const identifier = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const limit = checkRateLimit(`sign-up:${identifier}`, { limit: 5, windowMs: 60 * 60 * 1_000 });
    if (!limit.allowed) return apiJson({ error: "Too many attempts. Please try again later." }, 429);
    const input = schema.parse(await readJson(request));
    const db = getPrisma();
    const passwordHash = await hash(input.password, 12);
    const slugBase =
      input.organizationName
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80) || "workspace";
    const slug = `${slugBase}-${randomBytes(4).toString("hex")}`;
    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name: input.name, email: input.email, passwordHash },
      });
      const organization = await tx.organization.create({
        data: { name: input.organizationName, slug },
      });
      await tx.organizationMember.create({
        data: { organizationId: organization.id, userId: created.id, role: "Owner" },
      });
      await createStarterWorkspaceData(tx, organization.id, created.id);
      await tx.auditLog.create({
        data: {
          organizationId: organization.id,
          actorUserId: created.id,
          action: "workspace.created",
          entityType: "organization",
          entityId: organization.id,
        },
      });
      return created;
    });
    await createUserSession(user.id);
    return apiJson({ authenticated: true }, 201);
  } catch (error) {
    return apiError(error);
  }
}
