import { apiError, apiJson } from "@/lib/api/http";
import { getWorkspaceContext } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!isDatabaseConfigured()) return apiJson({ authenticated: false, configured: false, demo: true });
    const context = await getWorkspaceContext();
    if (!context) return apiJson({ authenticated: false, configured: true, demo: false });
    return apiJson({
      authenticated: true,
      configured: true,
      demo: false,
      user: context.user,
      organization: { id: context.organization.id, name: context.organization.name, slug: context.organization.slug },
      role: context.role,
    });
  } catch (error) {
    return apiError(error);
  }
}
