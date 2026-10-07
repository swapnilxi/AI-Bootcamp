import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import Anthropic from "@anthropic-ai/sdk";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const isCallerAdmin = session?.user?.role ? isAdminRole(session.user.role) : false;
    const isSelf = session?.user?.id === id;

    const instructor = await prisma.user.findFirst({
      where: {
        id,
        role: { in: ["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"] },
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
        specialties: true,
        mentorType: true,
        aiChatEnabled: true,
        aiSystemPrompt: true,
        aiChatStyle: true,
        aiGreeting: true,
        aiSampleQuestions: true,
      },
    });

    if (!instructor) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
    }

    return NextResponse.json({
      persona: {
        id: instructor.id,
        name: instructor.name,
        mentorType: instructor.mentorType,
        aiChatEnabled: instructor.aiChatEnabled,
        aiSystemPrompt: instructor.aiSystemPrompt,
        aiChatStyle: instructor.aiChatStyle,
        aiGreeting: instructor.aiGreeting,
        aiSampleQuestions: instructor.aiSampleQuestions
          ? JSON.parse(instructor.aiSampleQuestions)
          : [],
        canEdit: isCallerAdmin || isSelf,
      },
    });
  } catch (error) {
    console.error("GET ai-persona error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isCallerAdmin = session.user.role ? isAdminRole(session.user.role) : false;
    const isSelf = session.user.id === id;

    if (!isCallerAdmin && !isSelf) {
      return NextResponse.json(
        { error: "Forbidden: Only this instructor or administrators can configure AI persona context." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action = "extract_style", sampleChat = "", apply = false } = body;

    const instructor = await prisma.user.findFirst({
      where: { id },
      include: {
        createdCourses: {
          select: { title: true, description: true },
        },
      },
    });

    if (!instructor) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
    }

    if (action === "extract_style") {
      // Analyze chat samples or bio context to generate tone, system prompt & questions
      let extractedStyle = "";
      let suggestedPrompt = "";
      let suggestedGreeting = "";
      let suggestedQuestions: string[] = [];

      // Check if Anthropic API key is available
      if (process.env.ANTHROPIC_API_KEY && sampleChat.trim().length > 10) {
        try {
          const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
          const prompt = `Analyze this writing/chat sample from ${instructor.name || "the mentor"} (Specialties: ${instructor.specialties || "AI Engineering & Healing"}):

"${sampleChat}"

Extract:
1. "chatStyle": A 2-sentence description of their unique voice, tone, vocabulary, cadence, and mannerisms.
2. "systemPrompt": A 3-4 sentence system prompt instructing their AI Avatar on how to respond authentically.
3. "greeting": a 2-sentence greeting they would send to a learner.
4. "sampleQuestions": Array of 4 questions a learner would naturally ask them based on their style and domain.

Return ONLY a valid JSON object with keys: chatStyle, systemPrompt, greeting, sampleQuestions.`;

          const aiRes = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 600,
            temperature: 0.3,
            messages: [{ role: "user", content: prompt }],
          });

          const text = aiRes.content[0]?.type === "text" ? aiRes.content[0].text : "";
          const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
          extractedStyle = parsed.chatStyle;
          suggestedPrompt = parsed.systemPrompt;
          suggestedGreeting = parsed.greeting;
          suggestedQuestions = parsed.sampleQuestions;
        } catch (e) {
          console.warn("LLM style extraction failed, using heuristic synthesizer:", e);
        }
      }

      // Heuristic fallback when no model is configured, or the model returned
      // nothing usable. Branches on the instructor's declared specialties so a
      // RAG instructor does not get an agents persona.
      if (!extractedStyle) {
        const name = instructor.name || "Instructor";
        const spec = (instructor.specialties || "AI engineering").toLowerCase();
        const isRetrieval = spec.includes("rag") || spec.includes("retrieval") || spec.includes("evaluation");
        const isAgents = spec.includes("agent") || spec.includes("tool");

        if (isRetrieval) {
          extractedStyle = `Precise and measurement-first. Explains retrieval as a pipeline with measurable stages, and will not accept "it seems better" as evidence. Warm but unwilling to let a vague claim pass.`;
          suggestedPrompt = `You are ${name}, who builds and teaches retrieval systems. Help learners reason about chunking, dense versus sparse retrieval, reranking and evaluation. Always push toward a measurement: if they cannot say how they would know a change helped, that is the first thing to fix.`;
          suggestedGreeting = `Hello — I am ${name}. Ask me anything about retrieval: chunking, hybrid search, reranking, or how to measure any of it on your own corpus.`;
          suggestedQuestions = [
            "How do I pick a chunk size for my documents?",
            "Why does my RAG miss exact product codes?",
            "When is reranking worth the extra latency?",
            "How do I build an evaluation set that catches drift?",
          ];
        } else if (isAgents) {
          extractedStyle = `Direct and architecture-minded. Treats most agent failures as tool-design failures, and is quick to ask whether a fixed workflow would have been simpler, cheaper and more reliable.`;
          suggestedPrompt = `You are ${name}, who builds agent and multi-agent systems in production. Help learners with the agent loop, tool design, memory, planning, coordination and termination. Be honest about when an agent is the wrong answer.`;
          suggestedGreeting = `Hi, I am ${name}. Bring me an agent that is misbehaving and we will work out whether it is the loop, the tools or the task shape.`;
          suggestedQuestions = [
            "Why does my agent keep picking the wrong tool?",
            "Should this be an agent or a fixed workflow?",
            "How do I bound an agent loop safely?",
            "How do I evaluate a multi-agent trajectory?",
          ];
        } else {
          extractedStyle = `Clear, patient and mechanism-first. Explains why something works before how to use it, because the mechanism is what transfers to the next problem.`;
          suggestedPrompt = `You are ${name}, an instructor at AI Bootcamp. Explain AI engineering concepts at the level the learner is actually at — mechanism first, then a concrete example, then the failure mode. Never pad an answer to sound authoritative.`;
          suggestedGreeting = `Hello, I am ${name}. Ask me anything you are stuck on — however basic it feels. Most "advanced" confusion turns out to be a foundations gap.`;
          suggestedQuestions = [
            "Can you explain this concept more simply?",
            "What should I understand before starting this course?",
            "Why is my model overfitting?",
            "What should I build to practise this?",
          ];
        }
      }

      if (apply) {
        await prisma.user.update({
          where: { id },
          data: {
            aiChatStyle: extractedStyle,
            aiSystemPrompt: suggestedPrompt,
            aiGreeting: suggestedGreeting,
            aiSampleQuestions: JSON.stringify(suggestedQuestions),
            aiChatEnabled: true,
          },
        });
      }

      return NextResponse.json({
        success: true,
        extractedStyle,
        suggestedPrompt,
        suggestedGreeting,
        suggestedQuestions,
        applied: apply,
        message: apply
          ? "Chatting style and AI context successfully extracted and saved to mentor profile."
          : "Chatting style successfully analyzed. You can review and apply it.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST ai-persona error:", error);
    return NextResponse.json({ error: "Failed to configure AI persona" }, { status: 500 });
  }
}
