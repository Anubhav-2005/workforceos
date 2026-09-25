import { compare } from "bcryptjs";
import { z } from "zod";
import { apiError, apiJson, readJson } from "@/lib/api/http";
import { assertSameOrigin, createUserSession } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const schema = z.strictObject({
  email: z
    .email()
    .max(320)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const identifier = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const limit = checkRateLimit(`sign-in:${identifier}`, { limit: 10, windowMs: 15 * 60 * 1_000 });
    if (!limit.allowed) return apiJson({ error: "Too many attempts. Please try again later." }, 429);
    const input = schema.parse(await readJson(request));
    const user = await getPrisma().user.findUnique({ where: { email: input.email } });
    if (!user || !(await compare(input.password, user.passwordHash))) {
      return apiJson({ error: "Email or password is incorrect." }, 401);
    }
    await createUserSession(user.id);
    return apiJson({ authenticated: true });
  } catch (error) {
    return apiError(error);
  }
}
