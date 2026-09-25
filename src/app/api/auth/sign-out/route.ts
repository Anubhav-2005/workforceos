import { apiError, apiJson } from "@/lib/api/http";
import { assertSameOrigin, revokeCurrentSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await revokeCurrentSession();
    return apiJson({ authenticated: false });
  } catch (error) {
    return apiError(error);
  }
}
