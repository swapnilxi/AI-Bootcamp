import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { aiPreflight } from "@/lib/ai/guard";
import { describeAiError } from "@/lib/ai/client";
import { AiRefusalError } from "@/lib/ai/structured";
import { runLessonBreakdown } from "@/lib/ai/lessonHtml";
import { loadCustomModule, requireCustomModuleRead, saveCustomModuleVariant } from "@/lib/projects/customModule";

interface RouteParams {
  params: Promise<{ slug: string; moduleSlug: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  const { slug, moduleSlug } = await params;
  const loaded = await loadCustomModule(slug, moduleSlug);
  if ("error" in loaded) return loaded.error;
  const { project, customModule } = loaded;
  const guard = requireCustomModuleRead(customModule);
  if (guard) return guard;

  const session = await getServerSession(authOptions);
  const gate = await aiPreflight(req, "project-module-lesson", session?.user?.id, 10);
  if (!gate.ok) return gate.response;

  try {
    const result = await runLessonBreakdown(gate.credential, project.title, customModule.generatedHtml!);
    const variants = await saveCustomModuleVariant(
      customModule.id,
      { breakdown: { chunks: result.chunks, updatedAt: new Date().toISOString() } },
      customModule.variants
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
