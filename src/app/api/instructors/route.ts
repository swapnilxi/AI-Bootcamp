import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

/**
 * Users eligible to teach or offer healing (Instructor, Mentor, Admin, SuperAdmin).
 * Publicly viewable for faculty directory.
 */
const ALLOWED_INSTRUCTOR_NAMES = [
  "Arun Chauhan",
  "Swapnil Gupta",
  "Shresth Sahai",
];

const DEFAULT_INSTRUCTOR_AVATARS: Record<string, string> = {
  "Arun Chauhan": "/instructors/arun-chauhan.svg",
  "Swapnil Gupta": "/instructors/swapnil-gupta.svg",
  "Shresth Sahai": "/instructors/shresth-sahai.svg",
};

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isCallerAdmin = session?.user?.role ? isAdminRole(session.user.role) : false;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // INSTRUCTOR | MENTOR | ALL

    const where: any = {
      role: { in: ["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"] },
      name: { in: ALLOWED_INSTRUCTOR_NAMES },
      approvalStatus: "APPROVED",
    };

    if (type && type !== "ALL") {
      if (type === "MENTOR") {
        where.mentorType = { in: ["MENTOR", "BOTH"] };
      } else if (type === "INSTRUCTOR") {
        where.mentorType = { in: ["INSTRUCTOR", "BOTH"] };
      }
    }

    const instructors = await prisma.user.findMany({
      where,
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
        aiChatStyle: true,
        aiGreeting: true,
        aiSampleQuestions: true,
        approvalStatus: true,
        rejectionReason: true,
        approvalNudgesCount: true,
        lastNudgedAt: true,
        createdAt: true,
        ...(isCallerAdmin ? { email: true } : {}),
        _count: {
          select: {
            createdCourses: true,
            assignedBookings: true,
          },
        },
        createdCourses: {
          where: isCallerAdmin ? {} : { approvalStatus: "APPROVED", isPublished: true },
          take: 3,
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            durationMinutes: true,
          },
        },
      },
    });

    // Enforce strict order: 1- Arun Chauhan, 2- Swapnil Gupta, 3- Shresth Sahai
    const sorted = instructors.sort((a, b) => {
      const aIdx = ALLOWED_INSTRUCTOR_NAMES.indexOf(a.name || "");
      const bIdx = ALLOWED_INSTRUCTOR_NAMES.indexOf(b.name || "");
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    });

    return NextResponse.json({
      instructors: sorted.map((inst) => ({
        ...inst,
        avatarUrl: inst.avatarUrl || DEFAULT_INSTRUCTOR_AVATARS[inst.name || ""] || null,
        sessionPrice: inst.sessionPrice ? Number(inst.sessionPrice) : 150,
        mentorType: inst.mentorType || "BOTH",
      })),
    });
  } catch (error) {
    console.error("GET /api/instructors error:", error);
    return NextResponse.json({ error: "Failed to fetch instructors" }, { status: 500 });
  }
}
