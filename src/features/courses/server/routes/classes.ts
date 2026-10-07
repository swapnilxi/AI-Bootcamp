import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCreateClasses, isAdminRole, isInstructorRole } from "@/lib/roles";
import { createClassSchema } from "../../schemas/class";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter"); // all, free, subscriber, protected, mine, teaching

    const isCallerAdmin = session?.user?.role ? isAdminRole(session.user.role) : false;
    const whereClause: Record<string, unknown> = {};

    // Only administrators or the teaching instructor can see unapproved/unpublished classes
    if (!isCallerAdmin && filter !== "teaching") {
      whereClause.approvalStatus = "APPROVED";
      whereClause.isPublished = true;
    }

    if (filter === "free") {
      whereClause.price = 0;
      whereClause.isSubscriberOnly = false;
    } else if (filter === "subscriber") {
      whereClause.isSubscriberOnly = true;
    } else if (filter === "protected") {
      whereClause.isPasswordProtected = true;
    } else if (filter === "teaching") {
      if (!session?.user?.id) return NextResponse.json({ classes: [] });
      whereClause.instructorId = session.user.id;
    } else if (filter === "mine") {
      if (!session?.user?.id) return NextResponse.json({ classes: [] });
      whereClause.enrollments = { some: { userId: session.user.id } };
    }

    const classes = await prisma.course.findMany({
      where: whereClause,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
            mentorType: true,
          },
        },
        _count: { select: { enrollments: true, lessons: true } },
      },
      orderBy: { schedule: "asc" },
    });

    // Enrollment + lesson progress for the current user
    let userEnrollments = new Set<string>();
    const completedByClass = new Map<string, number>();
    if (session?.user?.id) {
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: session.user.id },
        select: { courseId: true },
      });
      userEnrollments = new Set(enrollments.map((e) => e.courseId));

      const progress = await prisma.lessonProgress.findMany({
        where: { userId: session.user.id },
        select: { lesson: { select: { courseId: true } } },
      });
      progress.forEach((p) =>
        completedByClass.set(p.lesson.courseId, (completedByClass.get(p.lesson.courseId) || 0) + 1)
      );
    }

    const isAdmin = isAdminRole(session?.user?.role);

    // Sanitize response: NEVER return passwordHash!
    const sanitizedClasses = classes.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      description: c.description,
      schedule: c.schedule,
      durationMinutes: c.durationMinutes,
      price: Number(c.price),
      isSubscriberOnly: c.isSubscriberOnly,
      isPasswordProtected: c.isPasswordProtected,
      instructor: c.instructor,
      enrollmentCount: c._count.enrollments,
      lessonCount: c._count.lessons,
      completedLessons: completedByClass.get(c.id) || 0,
      isEnrolled: userEnrollments.has(c.id),
      canManage: isAdmin || (!!session?.user?.id && c.instructorId === session.user.id),
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ classes: sanitizedClasses });
  } catch (error) {
    console.error("GET classes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canCreateClasses(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Only instructors and administrators can create classes" },
        { status: 403 }
      );
    }

    if (!isAdminRole(session.user.role)) {
      const me = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { approvalStatus: true },
      });
      if (me?.approvalStatus !== "APPROVED") {
        return NextResponse.json(
          { error: "Your instructor profile is still under verification. You can create classes once an administrator approves it." },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const result = createClassSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", issues: result.error.format() },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      content,
      schedule,
      durationMinutes,
      price,
      isSubscriberOnly,
      isPasswordProtected,
      password,
      instructorId: requestedInstructorId,
    } = result.data;

    // Instructors always teach their own classes; admins may assign any instructor-level user
    let instructorId = session.user.id;
    if (requestedInstructorId && requestedInstructorId !== session.user.id) {
      if (!isAdminRole(session.user.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only administrators can assign another instructor" },
          { status: 403 }
        );
      }
      const assignee = await prisma.user.findUnique({
        where: { id: requestedInstructorId },
        select: { role: true },
      });
      if (!assignee || !isInstructorRole(assignee.role)) {
        return NextResponse.json(
          { error: "Assigned instructor must be a user with the Instructor role or higher" },
          { status: 400 }
        );
      }
      instructorId = requestedInstructorId;
    }

    // Generate unique slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${baseSlug}-${randomSuffix}`;

    let passwordHash = null;
    if (isPasswordProtected && password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const isAdmin = isAdminRole(session.user.role);

    const newClass = await prisma.course.create({
      data: {
        title,
        slug,
        description,
        content,
        schedule: new Date(schedule),
        durationMinutes,
        price,
        isSubscriberOnly,
        isPasswordProtected,
        passwordHash,
        instructorId,
        approvalStatus: isAdmin ? "APPROVED" : "PENDING",
        isPublished: isAdmin,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        approvalStatus: true,
        isPublished: true,
        schedule: true,
        durationMinutes: true,
        price: true,
        isSubscriberOnly: true,
        isPasswordProtected: true,
        instructorId: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: "Course created successfully", course: newClass },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST class error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
