import "server-only";

export const MAX_RESUME_BYTES = 4 * 1024 * 1024;
export const MAX_MULTIPART_BYTES = MAX_RESUME_BYTES + 64 * 1024;

const MAX_RESUME_PAGES = 20;
const MAX_RESUME_CHARACTERS = 60_000;
const MIN_RESUME_CHARACTERS = 40;

export class ResumeFileError extends Error {
  constructor(
    message: string,
    readonly status: 413 | 415 | 422,
  ) {
    super(message);
    this.name = "ResumeFileError";
  }
}

export async function extractResumeText(file: File): Promise<string> {
  if (file.size === 0) throw new ResumeFileError("The uploaded resume is empty.", 422);
  if (file.size > MAX_RESUME_BYTES) throw new ResumeFileError("Resume files must be 4 MB or smaller.", 413);
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new ResumeFileError("Only PDF resumes are supported.", 415);
  }
  if (file.type && file.type !== "application/pdf" && file.type !== "application/octet-stream") {
    throw new ResumeFileError("Only PDF resumes are supported.", 415);
  }

  const data = Buffer.from(await file.arrayBuffer());
  if (data.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new ResumeFileError("This file is not a valid PDF document.", 415);
  }

  const { CanvasFactory } = await import("pdf-parse/worker");
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data, CanvasFactory });

  try {
    let result: Awaited<ReturnType<typeof parser.getText>>;
    try {
      result = await parser.getText({ first: MAX_RESUME_PAGES });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/password|encrypted/i.test(message)) {
        throw new ResumeFileError("Password-protected PDFs cannot be analyzed. Upload an unlocked copy.", 422);
      }
      throw new ResumeFileError("This PDF could not be read. Upload a different or repaired PDF.", 422);
    }

    if (result.total > MAX_RESUME_PAGES) {
      throw new ResumeFileError(`Resumes must be ${MAX_RESUME_PAGES} pages or fewer.`, 422);
    }

    const text = result.text
      .replace(/\0/g, "")
      .replace(/[^\S\r\n]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (text.length < MIN_RESUME_CHARACTERS) {
      throw new ResumeFileError("We could not find enough readable text in this PDF resume.", 422);
    }
    if (text.length > MAX_RESUME_CHARACTERS) {
      throw new ResumeFileError("This resume contains too much text. Upload a shorter PDF.", 422);
    }

    return text;
  } finally {
    await parser.destroy();
  }
}
