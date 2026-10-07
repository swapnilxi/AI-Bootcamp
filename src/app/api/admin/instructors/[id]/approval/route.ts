import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const approvalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "PENDING"]),
  rejectionReason: z.string().max(1000).optional(),
});

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = approvalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const { status, rejectionReason } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, mentorType: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        approvalStatus: status,
        // Approving an applicant is what grants the Instructor role
        ...(status === "APPROVED" && (user.role === "USER" || user.role === "SUBSCRIBER") && { role: "INSTRUCTOR" }),
        rejectionReason: status === "REJECTED" ? rejectionReason || "Profile criteria not met" : null,
      },
    });

    // Notify the mentor
    if (user.email) {
      const subject =
        status === "APPROVED"
          ? "✦ Faculty Profile Approved - Welcome to AI Bootcamp Academy"
          : status === "REJECTED"
          ? "AI Bootcamp Faculty Application Update"
          : "AI Bootcamp Faculty Profile Pending Review";

      const bodyText =
        status === "APPROVED"
          ? `Greetings ${user.name || "Mentor"},\n\nCongratulations! Your instructor & mentor profile has been approved by academy administration. Your profile is now published in our global Faculty Directory, and learners can book private sessions or enroll in your courses.\n\nAccess your teaching studio: https://aibootcamp.com/dashboard/instructor`
          : status === "REJECTED"
          ? `Greetings ${user.name || "Mentor"},\n\nThank you for submitting your application to the AI Bootcamp faculty. After review, administration was unable to approve your profile at this time.\n\nReason: ${rejectionReason || "Application requirements not fulfilled."}\n\nYou may update your credentials and submit again anytime.`
          : `Greetings ${user.name},\n\nYour profile has been set back to pending review status.`;

      await prisma.notificationLog.create({
        data: {
          channel: "EMAIL",
          kind: status === "APPROVED" ? "profile_approved" : "profile_rejected",
          recipient: user.email,
          subject,
          body: bodyText,
          status: "SENT",
          userId: user.id,
        },
      }).catch(() => null);
    }

    return NextResponse.json({
      message: `Mentor profile successfully set to ${status}`,
      mentor: updatedUser,
    });
  } catch (error) {
    console.error("PUT /api/admin/instructors/[id]/approval error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
