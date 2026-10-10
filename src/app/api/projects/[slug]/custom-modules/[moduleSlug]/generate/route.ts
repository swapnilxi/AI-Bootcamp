import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiPreflight } from "@/lib/ai/guard";
import { describeAiError } from "@/lib/ai/client";
import { AiRefusalError } from "@/lib/ai/structured";
import { TruncatedGenerationError, runLessonRead } from "@/lib/ai/lessonHtml";
import { loadCustomModule, buildCustomModuleContext } from "@/lib/projects/customModule";

interface RouteParams {
  params: Promise<{ slug: string; moduleSlug: string }>;
}

const requestSchema = z.object({
  topic: z.string().trim().max(8000).optional(),
  documentText: z.string().trim().max(20000).optional(),
  customTitle: z.string().trim().max(140).optional(),
  showAuthor: z.boolean().default(true),
});

function handleAiError(error: unknown) {
  if (error instanceof AiRefusalError) {
    return NextResponse.json({ error: "Couldn't generate that — try a narrower request." }, { status: 422 });
  }
  if (error instanceof TruncatedGenerationError) {
    return NextResponse.json({ error: error.message }, { status: 422 });
  }
  const { message, status } = describeAiError(error);
  return NextResponse.json({ error: message }, { status });
}

/** Generates the standalone "Read" lesson for a custom module from its brief and (optionally) extra topic/notes. */
export async function POST(req: Request, { params }: RouteParams) {
  const { slug, moduleSlug } = await params;
  const loaded = await loadCustomModule(slug, moduleSlug);
  if ("error" in loaded) return loaded.error;
  const { project, customModule } = loaded;

  const session = await getServerSession(authOptions);
  const gate = await aiPreflight(req, "project-module-lesson", session?.user?.id, 10);
  if (!gate.ok) return gate.response;

  const parsed = requestSchema.safeParse(await req.json().catch(() => ({})));
  const { topic, documentText, customTitle, showAuthor } = parsed.success
    ? parsed.data
    : { topic: undefined, documentText: undefined, customTitle: undefined, showAuthor: true };

  try {
    const extra = [topic, documentText ? `<attached_document>\n${documentText}\n</attached_document>` : null]
      .filter(Boolean)
      .join("\n\n");
    const ctx = buildCustomModuleContext(project, customModule, extra || customModule.description);
    if (customTitle) ctx.title = customTitle;
    const html = await runLessonRead(gate.credential, ctx);
    const updated = await prisma.projectModule.update({
      where: { id: customModule.id },
      data: {
        generatedHtml: html,
        htmlUpdatedAt: new Date(),
        ...(session?.user?.id ? { authorId: session.user.id, showAuthor } : {}),
      },
    });
    return NextResponse.json({ generatedHtml: updated.generatedHtml, htmlUpdatedAt: updated.htmlUpdatedAt });
  } catch (error) {
    return handleAiError(error);
  }
}
