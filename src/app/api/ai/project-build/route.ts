import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { z as z4 } from "zod/v4";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiPreflight } from "@/lib/ai/guard";
import { describeAiError } from "@/lib/ai/client";
import { AiRefusalError, generateStructured } from "@/lib/ai/structured";
import { BRAND_VOICE } from "@/lib/ai/prompts";
import { tasksForStage, type Task } from "@/app/projects/[slug]/modules";

const requestSchema = z.object({
  slug: z.string().min(1),
  instruction: z.string().trim().max(500).optional(),
});

const BuildScaffold = z4.object({
  html: z4
    .string()
    .describe(
      "A single self-contained HTML document: inline <style> and <script> only, no external resources (it renders in a sandboxed, offline iframe). Scaffold the page structure, layout and placeholder UI for the current build stage. Leave the project's core logic as clearly marked TODO comments for the learner to implement themselves — do not implement their requirements for them."
    ),
  notes: z4.string().describe("One or two sentences telling the learner what's scaffolded and what they still need to build."),
});

/** Project build stage: generates a starter HTML scaffold the learner can preview and fill in themselves. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const parsed = requestSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid request" }, { status: 400 });
  }
  const { slug, instruction } = parsed.data;

  const project = await prisma.project.findUnique({
    where: { slug },
    select: { title: true, problemStatement: true, architecture: true, requirements: true, tasks: true },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const preflight = await aiPreflight(req, "project-build", session?.user?.id, 10);
  if (!preflight.ok) return preflight.response;

  const buildTasks = tasksForStage(project.tasks as unknown as Task[], "IMPLEMENTATION");

  try {
    const scaffold = await generateStructured({
      credential: preflight.credential,
      schema: BuildScaffold,
      effort: "medium",
      maxTokens: 4000,
      system: `${BRAND_VOICE}

You are helping a learner start the build stage of their project. Give them a minimal, working starting point — not the finished thing. Handing over the solution is what stops the learning: scaffold structure and layout, stub the core logic behind TODO comments.`,
      prompt: `Generate a starter HTML scaffold for this project's build stage.

<project>
Title: ${project.title}
Problem: ${project.problemStatement}
Intended architecture: ${project.architecture}
Requirements: ${JSON.stringify(project.requirements)}
</project>

<build_tasks>
${buildTasks.map((t) => `- ${t.title}: ${t.detail}`).join("\n") || "(none staged)"}
</build_tasks>

${instruction ? `<learner_request>\n${instruction}\n</learner_request>` : ""}

The result must run standalone, offline, with no network calls.`,
    });

    return NextResponse.json({ html: scaffold.html, notes: scaffold.notes });
  } catch (error) {
    if (error instanceof AiRefusalError) {
      return NextResponse.json({ error: "Couldn't scaffold this one — try narrowing your request." }, { status: 422 });
    }
    const { message, status } = describeAiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
