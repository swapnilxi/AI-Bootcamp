import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { aiPreflight } from "@/lib/ai/guard";
import { describeAiError } from "@/lib/ai/client";
import { AiRefusalError } from "@/lib/ai/structured";
import { runLessonVisualize } from "@/lib/ai/lessonHtml";
import { loadOrCreateModuleLesson, requireModuleRead, saveModuleVariant, buildProjectStageContext } from "@/lib/projects/moduleLesson";

interface RouteParams {
  params: Promise<{ slug: string; stage: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  const { slug, stage } = await params;
  const loaded = await loadOrCreateModuleLesson(slug, stage);
  if ("error" in loaded) return loaded.error;
  const { project, moduleLesson } = loaded;
  const guard = requireModuleRead(moduleLesson);
  if (guard) return guard;

  const session = await getServerSession(authOptions);
  const gate = await aiPreflight(req, "project-module-lesson", session?.user?.id, 10);
  if (!gate.ok) return gate.response;

  try {
    const ctx = buildProjectStageContext(project, loaded.stage, moduleLesson.generatedHtml!);
    const result = await runLessonVisualize(gate.credential, ctx, moduleLesson.generatedHtml!);
    const variants = await saveModuleVariant(
      moduleLesson.id,
      {
        visual: {
          visualType: result.visualType,
          title: result.title,
          explanation: result.explanation,
          html: result.html,
          updatedAt: new Date().toISOString(),
        },
      },
      moduleLesson.variants
    );
    return NextResponse.json({ variants });
  } catch (error) {
    if (error instanceof AiRefusalError) {
      return NextResponse.json({ error: "Couldn't generate that — try again." }, { status: 422 });
    }
    const { message, status } = describeAiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
