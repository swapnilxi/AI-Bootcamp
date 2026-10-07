import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_HIERARCHY, RoleName, isAdminRole } from "@/lib/roles";
import { normalizePhone } from "@/lib/notify/channels";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().email("Invalid email").optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
});

/** Admins may manage users below their own rank; super admins manage everyone. */
function canEdit(actorRole: string | undefined, targetRole: string, isSelf: boolean) {
  if (isSelf) return true;
  if (actorRole === "SUPER_ADMIN") return true;
  return ROLE_HIERARCHY[(actorRole as RoleName) || "USER"] > ROLE_HIERARCHY[targetRole as RoleName];
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  bio: true,
  avatarUrl: true,
  createdAt: true,
  _count: { select: { bookings: true, enrollments: true } },
} as const;

export async function GET(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [bookings, notifications] = await Promise.all([
    prisma.booking.findMany({
      where: { OR: [{ userId: id }, { clientEmail: user.email }] },
      include: { service: { select: { title: true } } },
      orderBy: { scheduledAt: "desc" },
      take: 20,
    }),
    prisma.notificationLog.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return NextResponse.json({
    user,
    canEdit: canEdit(session.user.role, user.role, session.user.id === id),
    bookings: bookings.map((b) => ({
      id: b.id,
      referenceCode: b.referenceCode,
      serviceTitle: b.service.title,
      scheduledAt: b.scheduledAt,
      status: b.status,
    })),
    notifications: notifications.map((n) => ({
      id: n.id,
      channel: n.channel,
      kind: n.kind,
      subject: n.subject,
      status: n.status,
      error: n.error,
      createdAt: n.createdAt,
    })),
  });
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { role: true, email: true } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!canEdit(session.user.role, target.role, session.user.id === id)) {
      return NextResponse.json(
        { error: "Only a super administrator can edit administrator accounts" },
        { status: 403 }
      );
    }

    const parsed = updateSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid data" }, { status: 400 });
    }
    const d = parsed.data;

    let email: string | undefined;
    if (d.email && d.email.toLowerCase() !== target.email) {
      email = d.email.toLowerCase();
      const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (taken) return NextResponse.json({ error: "Another account already uses that email" }, { status: 409 });
    }

    let phone: string | null | undefined = undefined;
    if (d.phone === null || d.phone === "") phone = null;
    else if (d.phone) {
      phone = normalizePhone(d.phone);
      if (!phone) return NextResponse.json({ error: "Phone number looks invalid; include the country code" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(d.name !== undefined && { name: d.name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(d.bio !== undefined && { bio: d.bio || null }),
      },
      select: userSelect,
    });

    return NextResponse.json({ message: "User updated", user });
  } catch (error) {
    console.error("PATCH admin user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
