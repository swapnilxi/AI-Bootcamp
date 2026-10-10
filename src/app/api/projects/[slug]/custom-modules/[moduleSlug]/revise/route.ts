import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiPreflight } from "@/lib/ai/guard";
import { describeAiError } from "@/lib/ai/client";
import { AiRefusalError } from "@/lib/ai/structured";
import { runLessonRevise, TruncatedGenerationError } from "@/lib/ai/lessonHtml";
import { loadCustomModule } from "@/lib/projects/customModule";

interface RouteParams {
  params: Promise<{ slug: string; moduleSlug: string }>;
}

const reviseSchema = z.object({
  instruction: z.string().trim().max(500).optional(),
  html: z.string().optional(),
});

/** "Update" (AI reprompt) and "Edit"/"Upload" (direct save) both land here, distinguished by which field is sent. */
export async function POST(req: Request, { params }: RouteParams) {
  const { slug, moduleSlug } = await params;
  const loaded = await loadCustomModule(slug, moduleSlug);
  if ("error" in loaded) return loaded.error;
  const { customModule } = loaded;

  const body = await req.json().catch(() => ({}));
  const parsed = reviseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { instruction, html: directHtml } = parsed.data;
  if (!instruction && !directHtml) {
    return NextResponse.json({ error: "Provide an instruction or edited HTML" }, { status: 400 });
  }
  if (!customModule.generatedHtml && !directHtml) {
    return NextResponse.json({ error: "Generate the lesson first" }, { status: 400 });
  }

  if (directHtml) {
    const updated = await prisma.projectModule.update({
      where: { id: customModule.id },
      data: { generatedHtml: directHtml, htmlUpdatedAt: new Date() },
    });
    return NextResponse.json({ generatedHtml: updated.generatedHtml, htmlUpdatedAt: updated.htmlUpdatedAt });
  }

  const session = await getServerSession(authOptions);
  const gate = await aiPreflight(req, "project-module-lesson", session?.user?.id, 10);
  if (!gate.ok) return gate.response;

  try {
    const html = await runLessonRevise(gate.credential, instruction!, customModule.generatedHtml!);
    const updated = await prisma.projectModule.update({
      where: { id: customModule.id },
      data: { generatedHtml: html, htmlUpdatedAt: new Date() },
    });
    return NextResponse.json({ generatedHtml: updated.generatedHtml, htmlUpdatedAt: updated.htmlUpdatedAt });
  } catch (error) {
    if (error instanceof AiRefusalError) {
      return NextResponse.json({ error: "Couldn't apply that instruction — try narrowing it." }, { status: 422 });
    }
    if (error instanceof TruncatedGenerationError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    const { message, status } = describeAiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
