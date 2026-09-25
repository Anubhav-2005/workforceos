import "server-only";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth/session";
import { DatabaseConfigurationError } from "@/lib/db";
import { WorkflowRunError } from "@/lib/workflows/runner";

export function apiJson(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function apiError(error: unknown): Response {
  if (error instanceof AuthError || error instanceof DatabaseConfigurationError || error instanceof WorkflowRunError) {
    return apiJson({ error: error.message }, error.status);
  }
  if (error instanceof ZodError) {
    return apiJson(
      {
        error: "Check the submitted fields and try again.",
        details: error.issues.map((item) => ({
          field: item.path.join("."),
          message: item.message,
        })),
      },
      400,
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return apiJson({ error: "This record already exists." }, 409);
    if (error.code === "P2025") return apiJson({ error: "Record not found." }, 404);
  }
  console.error("WorkforceOS API request failed", {
    name: error instanceof Error ? error.name : "UnknownError",
  });
  return apiJson({ error: "The request could not be completed. Please try again." }, 500);
}

export async function readJson(request: Request, maxBytes = 32_000): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    throw new WorkflowRunError("Send a JSON request body.", 415);
  }
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) throw new WorkflowRunError("Request is too large.", 413);
  const text = await request.text();
  if (Buffer.byteLength(text) > maxBytes) throw new WorkflowRunError("Request is too large.", 413);
  try {
    return JSON.parse(text);
  } catch {
    throw new WorkflowRunError("Request body is not valid JSON.", 400);
  }
}
