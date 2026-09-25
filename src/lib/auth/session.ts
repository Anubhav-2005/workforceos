import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { OrganizationRole } from "@prisma/client";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";

const SESSION_COOKIE = "workforceos_session";
const WORKSPACE_COOKIE = "workforceos_workspace";
const SESSION_DAYS = 30;

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403 | 503 = 401,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createUserSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1_000);
  await getPrisma().session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function revokeCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token && isDatabaseConfigured()) {
    await getPrisma().session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  jar.delete(SESSION_COOKIE);
  jar.delete(WORKSPACE_COOKIE);
}

export async function getWorkspaceContext() {
  if (!isDatabaseConfigured()) return null;
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await getPrisma().session.findFirst({
    where: { tokenHash: hashToken(token), revokedAt: null, expiresAt: { gt: new Date() } },
    include: {
      user: {
        include: {
          memberships: {
            include: { organization: true },
            orderBy: { joinedAt: "asc" },
          },
        },
      },
    },
  });
  if (!session) return null;
  const preferredId = jar.get(WORKSPACE_COOKIE)?.value;
  const membership =
    session.user.memberships.find((item) => item.organizationId === preferredId) ?? session.user.memberships[0];
  if (!membership) return null;

  return {
    user: { id: session.user.id, email: session.user.email, name: session.user.name },
    organization: membership.organization,
    membership: { id: membership.id, organizationId: membership.organizationId, userId: membership.userId },
    role: membership.role,
  };
}

export async function requireWorkspaceContext() {
  if (!isDatabaseConfigured()) throw new AuthError("Workspace data is not configured on this installation.", 503);
  const context = await getWorkspaceContext();
  if (!context) throw new AuthError("Sign in to continue.", 401);
  return context;
}

export function requireWorkspaceRole(role: OrganizationRole, allowed: OrganizationRole[]): void {
  if (!allowed.includes(role)) throw new AuthError("Your workspace role cannot perform this action.", 403);
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new AuthError("Invalid request origin.", 403);
  }
  const requestUrl = new URL(request.url);
  const trustedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? requestUrl.host;
  if (originUrl.host !== trustedHost) throw new AuthError("Cross-origin request rejected.", 403);
}
