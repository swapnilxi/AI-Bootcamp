import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { notify } from "@/lib/notify/dispatch";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const moduleApprovalSchema = z.object({
  id: z.string(),
  approvalStatus: z.enum(["APPROVED", "REJECTED", "PENDING"]),
  rejectionReason: z.string().max(500).optional().nullable(),
});

const classApprovalSchema = z.object({
  approvalStatus: z.enum(["APPROVED", "REJECTED", "PENDING"]).optional(),
  isPublished: z.boolean().optional(),
  rejectionReason: z.string().max(1000).optional().nullable(),
  modules: z.array(moduleApprovalSchema).optional(),
});

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = classApprovalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const { approvalStatus, isPublished, rejectionReason, modules } = parsed.data;

    const existingClass = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        lessons: true,
      },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Run in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update class if fields provided
      const classUpdates: any = {};
      if (approvalStatus !== undefined) {
        classUpdates.approvalStatus = approvalStatus;
        if (approvalStatus === "REJECTED") {
          classUpdates.rejectionReason = rejectionReason || "Course does not satisfy academy standards";
          classUpdates.isPublished = false;
        } else if (approvalStatus === "APPROVED") {
          classUpdates.rejectionReason = null;
        }
      }

      if (isPublished !== undefined) {
        classUpdates.isPublished = isPublished;
      }

      if (rejectionReason !== undefined && approvalStatus !== "APPROVED") {
        classUpdates.rejectionReason = rejectionReason;
      }

      if (Object.keys(classUpdates).length > 0) {
        await tx.course.update({
          where: { id },
          data: classUpdates,
        });
      }

      // 2. Update modules if provided
      if (modules && modules.length > 0) {
        for (const mod of modules) {
          await tx.lesson.update({
            where: { id: mod.id },
            data: {
              approvalStatus: mod.approvalStatus,
              rejectionReason:
                mod.approvalStatus === "REJECTED" ? mod.rejectionReason || "Module rejected by administration" : null,
            },
          });
        }
      }
    });

    // Notify the instructor
    if (existingClass.instructor?.email) {
      const isApproved = approvalStatus === "APPROVED" || (isPublished === true && approvalStatus !== "REJECTED");
      const rejectedMods = modules?.filter((m) => m.approvalStatus === "REJECTED") || [];

      let note = "";
      if (rejectedMods.length > 0) {
        note = `\n\nNote: ${rejectedMods.length} individual module(s) require modifications before they can be made visible to learners.`;
      }

      await notify(existingClass.instructor, {
        kind: isApproved ? "class_approved" : "class_status_change",
        title: `Curriculum review update: ${existingClass.title}`,
        body: `Your curriculum submission "${existingClass.title}" has been reviewed by administration.\nStatus: ${approvalStatus || existingClass.approvalStatus}\nPublished: ${(isPublished ?? existingClass.isPublished) ? "yes" : "no"}${note}`,
        href: "/dashboard/instructor",
        sentById: session.user.id,
      });
    }

    const updated = await prisma.course.findUnique({
      where: { id },
      include: {
        lessons: { orderBy: { order: "asc" } },
        instructor: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({
      message: "Class and modules review status updated successfully",
      course: updated,
    });
  } catch (error) {
    console.error("PUT /api/admin/classes/[id]/approval error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
