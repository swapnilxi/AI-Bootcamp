import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { parseProfileSections } from "@/lib/validations/profileSections";

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;
export const fetchCache = "force-no-store";

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
        role: true,
        avatarUrl: true,
        bio: true,
        mentorType: true,
        specialties: true,
        sessionPrice: true,
        sessionDuration: true,
        aiChatEnabled: true,
        aiSystemPrompt: true,
        aiChatStyle: true,
        aiGreeting: true,
        aiSampleQuestions: true,
        profileSections: true,
        approvalStatus: true,
        rejectionReason: true,
        approvalNudgesCount: true,
        lastNudgedAt: true,
        createdAt: true,
        ...(isCallerAdmin || isSelf ? { email: true } : {}),
        createdCourses: {
          where: isCallerAdmin || isSelf ? {} : { approvalStatus: "APPROVED", isPublished: true },
          orderBy: { schedule: "desc" },
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
            approvalStatus: true,
            isPublished: true,
            _count: {
              select: {
                enrollments: true,
                lessons: true,
              },
            },
          },
        },
      },
    });

    if (!instructor) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
    }

    // Public cannot view unapproved profiles unless self or admin
    if (instructor.approvalStatus !== "APPROVED" && !isCallerAdmin && !isSelf) {
      return NextResponse.json({ error: "This mentor profile is currently under review." }, { status: 403 });
    }

    return NextResponse.json(
      {
        instructor: {
          ...instructor,
          sessionPrice: instructor.sessionPrice ? Number(instructor.sessionPrice) : 120,
          mentorType: instructor.mentorType || (instructor.role === "INSTRUCTOR" ? "INSTRUCTOR" : "BOTH"),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("GET instructor profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isCallerAdmin = session.user.role ? isAdminRole(session.user.role) : false;
    const isSelf = session.user.id === id;

    if (!isCallerAdmin && !isSelf) {
      return NextResponse.json({ error: "Forbidden: Cannot edit another instructor's profile" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const updateData: any = {};

    if (typeof body.bio === "string") updateData.bio = body.bio;
    if (typeof body.specialties === "string") updateData.specialties = body.specialties;
    if (typeof body.sessionPrice === "number") updateData.sessionPrice = body.sessionPrice;
    if (typeof body.sessionDuration === "number") updateData.sessionDuration = body.sessionDuration;
    if (typeof body.mentorType === "string") updateData.mentorType = body.mentorType;

    // Custom profile sections
    if (typeof body.profileSections === "string") {
      const sections = parseProfileSections(body.profileSections);
      if (!sections.ok) return NextResponse.json({ error: sections.error }, { status: 400 });
      updateData.profileSections = sections.json;
    }

    // AI persona fields
    if (typeof body.aiChatEnabled === "boolean") updateData.aiChatEnabled = body.aiChatEnabled;
    if (typeof body.aiSystemPrompt === "string") updateData.aiSystemPrompt = body.aiSystemPrompt;
    if (typeof body.aiChatStyle === "string") updateData.aiChatStyle = body.aiChatStyle;
    if (typeof body.aiGreeting === "string") updateData.aiGreeting = body.aiGreeting;
    if (typeof body.aiSampleQuestions === "string") updateData.aiSampleQuestions = body.aiSampleQuestions;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        specialties: true,
        sessionPrice: true,
        sessionDuration: true,
        mentorType: true,
        aiChatEnabled: true,
        aiSystemPrompt: true,
        aiChatStyle: true,
        aiGreeting: true,
        aiSampleQuestions: true,
        profileSections: true,
      },
    });

    return NextResponse.json({ instructor: updated, message: "Instructor profile and AI persona saved successfully." });
  } catch (error) {
    console.error("PATCH instructor profile error:", error);
    return NextResponse.json({ error: "Failed to update instructor profile" }, { status: 500 });
  }
}

