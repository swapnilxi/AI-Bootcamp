import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isInstructorRole } from "@/lib/roles";

const MAX_CHARS = 20000;
const MAX_BYTES = 15 * 1024 * 1024; // 15MB

/** Extracts plain text from an uploaded .txt/.md/.pdf/.docx document for the lesson generator. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isInstructorRole(session?.user?.role)) {
    return NextResponse.json({ error: "Only instructors and administrators can upload documents" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file attached" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max 15MB)" }, { status: 413 });
  }

  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    let text: string;
    if (name.endsWith(".pdf")) {
      const pdfParse = (await import("pdf-parse")).default ?? (await import("pdf-parse"));
      const result = await (pdfParse as unknown as (data: Buffer) => Promise<{ text: string }>)(buffer);
      text = result.text;
    } else if (name.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".markdown") || name.endsWith(".mdx")) {
      text = buffer.toString("utf-8");
    } else {
      return NextResponse.json({ error: "Supported formats: PDF, Word (.docx), Markdown, or plain text" }, { status: 400 });
    }

    return NextResponse.json({ text: text.trim().slice(0, MAX_CHARS), fileName: file.name });
  } catch {
    return NextResponse.json({ error: "Couldn't read that document — try a different file." }, { status: 422 });
  }
}
