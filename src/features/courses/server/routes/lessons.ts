import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClassAccess } from "../access";
import { isAdminRole } from "@/lib/roles";
import { createLessonSchema } from "../../schemas/lesson";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Lesson list. Full lesson bodies are only included for users with access. */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const cls = await prisma.course.findUnique({ where: { id } });
    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const access = await getClassAccess(session, cls);
    const lessons = await prisma.lesson.findMany({
      where: access.canManage ? { courseId: id } : { courseId: id, approvalStatus: "APPROVED" },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({
      lessons: lessons.map((l) => {
        const isAccessible = access.canViewContent || l.isPreview;
        return {
          id: l.id,
          title: l.title,
          summary: l.summary,
          durationMinutes: l.durationMinutes,
          order: l.order,
          isPreview: l.isPreview,
          isAccessible,
          approvalStatus: l.approvalStatus,
          rejectionReason: access.canManage ? l.rejectionReason : null,
          // Managers need raw fields to edit; learners get content only when accessible
          content: isAccessible ? l.content : null,
          videoUrl: isAccessible ? l.videoUrl : null,
        };
      }),
      canManage: access.canManage,
    });
  } catch (error) {
    console.error("GET lessons error:", error);
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

    const cls = await prisma.course.findUnique({ where: { id } });
    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const access = await getClassAccess(session, cls);
    if (!access.canManage) {
      return NextResponse.json(
        { error: "Forbidden: Only this class's instructor or an administrator can add lessons" },
        { status: 403 }
      );
    }

    const result = createLessonSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Validation error", issues: result.error.format() },
        { status: 400 }
      );
    }

    // Append to the end of the curriculum
    const last = await prisma.lesson.findFirst({
      where: { courseId: id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const lesson = await prisma.lesson.create({
      data: {
        ...result.data,
        durationMinutes: result.data.durationMinutes ?? null,
        courseId: id,
        order: (last?.order ?? -1) + 1,
        // Lessons authored by instructors go through admin module review
        approvalStatus: isAdminRole(session.user.role) ? "APPROVED" : "PENDING",
      },
    });

    return NextResponse.json({ message: "Lesson added", lesson }, { status: 201 });
  } catch (error) {
    console.error("POST lesson error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
