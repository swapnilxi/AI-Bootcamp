import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClassAccess } from "../access";
import { isAdminRole } from "@/lib/roles";
import { notifyReviewSubmitted } from "../notifyCreator";
import { updateLessonSchema } from "../../schemas/lesson";

interface RouteParams {
  params: Promise<{ id: string; lessonId: string }>;
}

async function loadLesson(courseId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: true, author: { select: { id: true, name: true } } },
  });
  if (!lesson || lesson.courseId !== courseId) return null;
  return lesson;
}

/** Full lesson for learners with access (or free previews), plus prev/next navigation. */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id, lessonId } = await params;
    const session = await getServerSession(authOptions);

    const lesson = await loadLesson(id, lessonId);
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const access = await getClassAccess(session, lesson.course);

    // If lesson is not approved, only managers can view it
    if (lesson.approvalStatus !== "APPROVED" && !access.canManage) {
      return NextResponse.json(
        { error: "This module is currently awaiting verification by academy administration." },
        { status: 403 }
      );
    }

    if (!access.canViewContent && !lesson.isPreview) {
      return NextResponse.json(
        {
          error: "Enroll in this class to access this lesson",
          requiresEnrollment: true,
        },
        { status: 403 }
      );
    }

    const siblings = await prisma.lesson.findMany({
      where: access.canManage ? { courseId: id } : { courseId: id, approvalStatus: "APPROVED" },
      orderBy: { order: "asc" },
      select: { id: true, title: true, isPreview: true, durationMinutes: true, approvalStatus: true },
    });

    let completedIds = new Set<string>();
    if (session?.user?.id) {
      const progress = await prisma.lessonProgress.findMany({
        where: { userId: session.user.id, lessonId: { in: siblings.map((s) => s.id) } },
        select: { lessonId: true },
      });
      completedIds = new Set(progress.map((p) => p.lessonId));
    }

    const index = siblings.findIndex((s) => s.id === lessonId);

    return NextResponse.json({
      lesson: {
        id: lesson.id,
        title: lesson.title,
        summary: lesson.summary,
        content: lesson.content,
        videoUrl: lesson.videoUrl,
        durationMinutes: lesson.durationMinutes,
        isPreview: lesson.isPreview,
        position: index + 1,
        isCompleted: completedIds.has(lesson.id),
        generatedHtml: lesson.generatedHtml,
        variants: lesson.variants,
        interactivity: lesson.interactivity,
        htmlUpdatedAt: lesson.htmlUpdatedAt,
        authorId: lesson.authorId,
        authorName: lesson.author?.name ?? null,
        showAuthor: lesson.showAuthor,
        canClaimAuthorship: access.canManage && lesson.authorId !== session?.user?.id,
      },
      course: {
        id: lesson.course.id,
        title: lesson.course.title,
        canManage: access.canManage,
        canViewContent: access.canViewContent,
        isEnrolled: access.isEnrolled,
      },
      outline: siblings.map((s) => ({
        ...s,
        isAccessible: access.canViewContent || s.isPreview,
        isCompleted: completedIds.has(s.id),
      })),
      prevId: index > 0 ? siblings[index - 1].id : null,
      nextId: index < siblings.length - 1 ? siblings[index + 1].id : null,
    });
  } catch (error) {
    console.error("GET lesson error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id, lessonId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lesson = await loadLesson(id, lessonId);
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const access = await getClassAccess(session, lesson.course);
    if (!access.canManage) {
      return NextResponse.json(
        { error: "Forbidden: Only this class's instructor or an administrator can edit lessons" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const result = updateLessonSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Validation error", issues: result.error.format() },
        { status: 400 }
      );
    }

    const data = Object.fromEntries(
      Object.entries(result.data).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>;
    // "Claim authorship" is an action, not a plain field: it can only ever
    // credit the caller themselves, never an arbitrary user id from the body.
    if (body?.claimAuthorship === true) {
      data.authorId = session.user.id;
    }
    // An instructor revising a declined lesson resubmits it for review
    if (!isAdminRole(session.user.role) && lesson.approvalStatus === "REJECTED") {
      data.approvalStatus = "PENDING";
      data.rejectionReason = null;
    }
    const updated = await prisma.lesson.update({ where: { id: lessonId }, data });

    if (data.approvalStatus === "PENDING") {
      await notifyReviewSubmitted({ what: "lesson", course: { id: lesson.course.id, title: lesson.course.title }, creatorId: session.user.id });
    }

    return NextResponse.json({ message: "Lesson updated", lesson: updated });
  } catch (error) {
    console.error("PUT lesson error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id, lessonId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lesson = await loadLesson(id, lessonId);
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const access = await getClassAccess(session, lesson.course);
    if (!access.canManage) {
      return NextResponse.json(
        { error: "Forbidden: Only this class's instructor or an administrator can delete lessons" },
        { status: 403 }
      );
    }

    await prisma.lesson.delete({ where: { id: lessonId } });
    return NextResponse.json({ message: "Lesson deleted" });
  } catch (error) {
    console.error("DELETE lesson error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
