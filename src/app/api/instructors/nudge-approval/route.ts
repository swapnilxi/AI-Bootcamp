import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyRoles } from "@/lib/notify/dispatch";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mentorType: true,
        approvalStatus: true,
        approvalNudgesCount: true,
        lastNudgedAt: true,
      },
    });

    if (!user || !["INSTRUCTOR", "USER", "SUBSCRIBER"].includes(user.role)) {
      return NextResponse.json(
        { error: "Only instructors and mentors awaiting review can request expedited review." },
        { status: 403 }
      );
    }

    if (user.role !== "INSTRUCTOR" && user.approvalStatus !== "PENDING") {
      return NextResponse.json(
        { error: "Only instructors and mentors awaiting review can request expedited review." },
        { status: 403 }
      );
    }

    if (user.approvalStatus === "APPROVED") {
      return NextResponse.json({
        message: "Your profile is already approved and active in the faculty directory.",
        alreadyApproved: true,
      });
    }

    const now = new Date();
    let currentNudges = user.approvalNudgesCount || 0;

    // Reset daily counter if last nudge was on a previous calendar day (UTC)
    if (user.lastNudgedAt) {
      const lastDate = new Date(user.lastNudgedAt);
      const isSameDay =
        lastDate.getUTCFullYear() === now.getUTCFullYear() &&
        lastDate.getUTCMonth() === now.getUTCMonth() &&
        lastDate.getUTCDate() === now.getUTCDate();

      if (!isSameDay) {
        currentNudges = 0;
      }
    }

    if (currentNudges >= 3) {
      return NextResponse.json(
        {
          error:
            "Daily limit reached. You can notify administration up to 3 times per day. Your profile is queued for expedited review.",
          nudgesRemaining: 0,
        },
        { status: 429 }
      );
    }

    const updatedNudges = currentNudges + 1;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        approvalNudgesCount: updatedNudges,
        lastNudgedAt: now,
      },
    });

    // Alert every admin (in-app + email) — replaces the old placeholder log row.
    await notifyRoles(["ADMIN", "SUPER_ADMIN"], {
      kind: "admin_alert",
      title: `[Expedited review ${updatedNudges}/3] Mentor profile: ${user.name || user.email}`,
      body: `${user.name || "A mentor"} (${user.email}, type: ${user.mentorType || "INSTRUCTOR"}) has sent nudge #${updatedNudges} requesting expedited verification of their profile.`,
      href: "/dashboard/admin",
    });

    return NextResponse.json({
      success: true,
      message: `Notification sent to administration. (${updatedNudges}/3 alerts sent today)`,
      nudgesRemaining: 3 - updatedNudges,
      nudgesToday: updatedNudges,
    });
  } catch (error) {
    console.error("POST /api/instructors/nudge-approval error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
