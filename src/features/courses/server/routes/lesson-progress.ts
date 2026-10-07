import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClassAccess } from "../access";

interface RouteParams {
  params: Promise<{ id: string; lessonId: string }>;
}

async function authorize(params: RouteParams["params"]) {
  const { id, lessonId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Please log in to track progress" }, { status: 401 }) };
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { course: true } });
  if (!lesson || lesson.courseId !== id) {
    return { error: NextResponse.json({ error: "Lesson not found" }, { status: 404 }) };
  }

  const access = await getClassAccess(session, lesson.course);
  if (!access.canViewContent && !lesson.isPreview) {
    return { error: NextResponse.json({ error: "Enroll in this class first" }, { status: 403 }) };
  }

  return { userId: session.user.id, lessonId };
}

/** Mark a lesson complete for the current user (idempotent). */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const auth = await authorize(params);
    if ("error" in auth) return auth.error;

    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: auth.userId, lessonId: auth.lessonId } },
      create: { userId: auth.userId, lessonId: auth.lessonId },
      update: {},
    });
    return NextResponse.json({ completed: true });
  } catch (error) {
    console.error("Mark lesson complete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Mark a lesson as not complete. */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const auth = await authorize(params);
    if ("error" in auth) return auth.error;

    await prisma.lessonProgress.deleteMany({
      where: { userId: auth.userId, lessonId: auth.lessonId },
    });
    return NextResponse.json({ completed: false });
  } catch (error) {
    console.error("Unmark lesson error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
