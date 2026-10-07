import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClassAccess } from "../access";
import { reorderLessonsSchema } from "../../schemas/lesson";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Persist a new lesson order: body is the full list of lesson ids in display order. */
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = reorderLessonsSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json({ error: "lessonIds array is required" }, { status: 400 });
    }

    const existing = await prisma.lesson.findMany({ where: { courseId: id }, select: { id: true } });
    const existingIds = new Set(existing.map((l) => l.id));
    const { lessonIds } = result.data;
    if (
      lessonIds.length !== existingIds.size ||
      new Set(lessonIds).size !== lessonIds.length ||
      !lessonIds.every((lid) => existingIds.has(lid))
    ) {
      return NextResponse.json(
        { error: "lessonIds must contain every lesson of this class exactly once" },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      lessonIds.map((lessonId, index) =>
        prisma.lesson.update({ where: { id: lessonId }, data: { order: index } })
      )
    );

    return NextResponse.json({ message: "Lesson order saved" });
  } catch (error) {
    console.error("Reorder lessons error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
