import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { aiPreflight, sanitizeChat } from "@/lib/ai/guard";
import { describeAiError } from "@/lib/ai/client";
import { chatProviderOnce } from "@/lib/ai/providers";
import { BRAND_VOICE } from "@/lib/ai/prompts";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * An instructor's AI twin.
 *
 * It answers as that instructor, grounded in the profile they wrote and the
 * courses they actually teach — so it can point at real material rather than
 * inventing a syllabus.
 */
export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;

  const instructor = await prisma.user.findFirst({
    where: { id, role: { in: ["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"] } },
    select: {
      id: true,
      name: true,
      bio: true,
      specialties: true,
      mentorType: true,
      sessionPrice: true,
      sessionDuration: true,
      aiChatEnabled: true,
      aiSystemPrompt: true,
      aiChatStyle: true,
      createdCourses: {
        where: { approvalStatus: "APPROVED", isPublished: true },
        select: { id: true, title: true, description: true },
      },
    },
  });

  if (!instructor) {
    return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
  }
  if (!instructor.aiChatEnabled) {
    return NextResponse.json({ error: "This instructor has not enabled their AI twin." }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  const preflight = await aiPreflight(req, `twin:${id}`, session?.user?.id, 25);
  if (!preflight.ok) return preflight.response;

  const body = await req.json().catch(() => ({}));
  const messages = sanitizeChat(body?.messages);
  if (!messages) {
    return NextResponse.json({ error: "A question is required." }, { status: 400 });
  }

  const courseContext =
    instructor.createdCourses.length > 0
      ? `\nCourses ${instructor.name} teaches here:\n` +
        instructor.createdCourses.map((c) => `- "${c.title}": ${c.description}`).join("\n")
      : "";

  const role =
    instructor.mentorType === "MENTOR"
      ? "AI engineering mentor"
      : instructor.mentorType === "BOTH"
        ? "instructor and mentor"
        : "AI engineering instructor";

  const systemPrompt = `${BRAND_VOICE}

You are the AI twin of ${instructor.name || "an instructor"} at AI Bootcamp. Answer as them, in the first person.

Role: ${role}.
Specialties: ${instructor.specialties || "AI engineering"}.
Background: ${instructor.bio || "Builds and teaches production AI systems."}
${courseContext}

1-on-1 mentor sessions: $${Number(instructor.sessionPrice) || 120} for ${instructor.sessionDuration || 60} minutes.

How you answer:
${instructor.aiChatStyle || "Direct, technical and encouraging. Explain the mechanism, give a concrete example, name the trade-off."}

Stay inside this instructor's specialties. If a question falls well outside them, say so and point at the part of the curriculum that covers it. Never invent a course, a credential or a result. Keep it to two or three paragraphs.

${instructor.aiSystemPrompt || ""}`;

  try {
    const reply = await chatProviderOnce(preflight.credential, { system: systemPrompt, messages, maxTokens: 1024 });
    if (!reply) {
      return NextResponse.json({ error: "The AI twin had nothing to say. Try rephrasing." }, { status: 502 });
    }

    return NextResponse.json({
      reply,
      instructorName: instructor.name,
      mentorType: instructor.mentorType,
    });
  } catch (error) {
    const { message, status } = describeAiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
