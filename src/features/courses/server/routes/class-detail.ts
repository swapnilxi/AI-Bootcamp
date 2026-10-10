import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClassAccess } from "../access";
import { isAdminRole, isInstructorRole } from "@/lib/roles";
import { updateClassSchema } from "../../schemas/class";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const foundClass = await prisma.course.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        instructor: {
          select: { id: true, name: true, avatarUrl: true, bio: true, role: true },
        },
        _count: { select: { enrollments: true } },
        lessons: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            summary: true,
            durationMinutes: true,
            order: true,
            isPreview: true,
            videoUrl: true,
            approvalStatus: true,
            rejectionReason: true,
          },
        },
      },
    });

    if (!foundClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const access = await getClassAccess(session, foundClass);

    // If class is not approved or not published, only managers can view it
    if ((foundClass.approvalStatus !== "APPROVED" || !foundClass.isPublished) && !access.canManage) {
      return NextResponse.json(
        { error: "This class curriculum is currently under review by academy administration." },
        { status: 403 }
      );
    }

    let completedIds = new Set<string>();
    if (session?.user?.id && foundClass.lessons.length > 0) {
      const progress = await prisma.lessonProgress.findMany({
        where: {
          userId: session.user.id,
          lessonId: { in: foundClass.lessons.map((l) => l.id) },
        },
        select: { lessonId: true },
      });
      completedIds = new Set(progress.map((p) => p.lessonId));
    }

    // Filter out unapproved/rejected lessons for non-managers
    const visibleLessons = access.canManage
      ? foundClass.lessons
      : foundClass.lessons.filter((l) => l.approvalStatus === "APPROVED");

    // Lesson outline is public; whether each lesson can be opened depends on access
    const lessons = visibleLessons.map((l) => {
      const isApproved = l.approvalStatus === "APPROVED";
      const isAccessible = access.canViewContent || (l.isPreview && isApproved);
      return {
        id: l.id,
        title: l.title,
        summary: l.summary,
        durationMinutes: l.durationMinutes,
        order: l.order,
        isPreview: l.isPreview,
        approvalStatus: l.approvalStatus,
        rejectionReason: access.canManage ? l.rejectionReason : null,
        hasVideo: !!l.videoUrl,
        isAccessible,
        isCompleted: completedIds.has(l.id),
      };
    });

    // Never return passwordHash!
    return NextResponse.json({
      course: {
        id: foundClass.id,
        title: foundClass.title,
        slug: foundClass.slug,
        description: foundClass.description,
        syllabus: foundClass.syllabus,
        content: access.canViewContent ? foundClass.content : null,
        aiContext: access.canManage ? foundClass.aiContext : null,
        pathId: foundClass.pathId,
        schedule: foundClass.schedule,
        durationMinutes: foundClass.durationMinutes,
        price: Number(foundClass.price),
        isSubscriberOnly: foundClass.isSubscriberOnly,
        isPasswordProtected: foundClass.isPasswordProtected,
        instructorId: foundClass.instructorId,
        approvalStatus: foundClass.approvalStatus,
        isPublished: foundClass.isPublished,
        rejectionReason: access.canManage ? foundClass.rejectionReason : null,
        instructor: foundClass.instructor,
        enrollmentCount: foundClass._count.enrollments,
        lessons,
        completedLessons: completedIds.size,
        ...access,
        createdAt: foundClass.createdAt,
      },
    });
  } catch (error) {
    console.error("GET class by id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const access = await getClassAccess(session, existing);
    if (!access.canManage) {
      return NextResponse.json(
        { error: "Forbidden: Only this class's instructor or an administrator can modify it" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = updateClassSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", issues: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;
    let passwordHash: string | null | undefined = undefined;

    if (data.isPasswordProtected && data.password) {
      passwordHash = await bcrypt.hash(data.password, 10);
    } else if (data.isPasswordProtected === false) {
      passwordHash = null;
    } else if (data.isPasswordProtected && !existing.passwordHash) {
      // Turning protection on without a key would lock everyone out permanently
      return NextResponse.json(
        { error: "A class password is required when enabling password protection" },
        { status: 400 }
      );
    }

    // Reassigning the instructor is an admin-only action
    let instructorId: string | undefined = undefined;
    if (data.instructorId && data.instructorId !== existing.instructorId) {
      if (!isAdminRole(session.user.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only administrators can reassign the instructor" },
          { status: 403 }
        );
      }
      const assignee = await prisma.user.findUnique({
        where: { id: data.instructorId },
        select: { role: true },
      });
      if (!assignee || !isInstructorRole(assignee.role)) {
        return NextResponse.json(
          { error: "Assigned instructor must be a user with the Instructor role or higher" },
          { status: 400 }
        );
      }
      instructorId = data.instructorId;
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.schedule !== undefined && { schedule: new Date(data.schedule) }),
        ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.isSubscriberOnly !== undefined && { isSubscriberOnly: data.isSubscriberOnly }),
        ...(data.isPasswordProtected !== undefined && { isPasswordProtected: data.isPasswordProtected }),
        ...(passwordHash !== undefined && { passwordHash }),
        ...(instructorId !== undefined && { instructorId }),
        ...(data.pathId !== undefined && { pathId: data.pathId || null }),
        ...(data.aiContext !== undefined && { aiContext: data.aiContext }),
        // An instructor revising a declined class resubmits it for review
        ...(!isAdminRole(session.user.role) &&
          existing.approvalStatus === "REJECTED" && { approvalStatus: "PENDING", rejectionReason: null }),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        schedule: true,
        durationMinutes: true,
        price: true,
        isSubscriberOnly: true,
        isPasswordProtected: true,
        instructorId: true,
        pathId: true,
        aiContext: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ message: "Course updated successfully", course: updated });
  } catch (error) {
    console.error("PUT class error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const access = await getClassAccess(session, existing);
    if (!access.canManage) {
      return NextResponse.json(
        { error: "Forbidden: Only this class's instructor or an administrator can delete it" },
        { status: 403 }
      );
    }

    await prisma.course.delete({ where: { id } });

    return NextResponse.json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error("DELETE class error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
