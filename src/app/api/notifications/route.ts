import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** The signed-in user's own inbox. Every role (USER → SUPER_ADMIN) gets exactly this. */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);
  const unreadOnly = searchParams.get("unread") === "1";
  const where = { userId: session.user.id, ...(unreadOnly ? { readAt: null } : {}) };

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take: limit }),
    prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
  ]);
  return NextResponse.json({ items, unreadCount });
}

const patchSchema = z.object({
  ids: z.array(z.string()).max(100).optional(),
  all: z.boolean().optional(),
});

/** Mark specific notifications (or all) as read. Scoped to the caller — can't touch others' rows. */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success || (!parsed.data.all && !parsed.data.ids?.length)) {
    return NextResponse.json({ error: "Provide ids or all: true" }, { status: 400 });
  }
  const { count } = await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null, ...(parsed.data.all ? {} : { id: { in: parsed.data.ids } }) },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ updated: count });
}

/** Delete read notifications (clear history). */
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { count } = await prisma.notification.deleteMany({ where: { userId: session.user.id, readAt: { not: null } } });
  return NextResponse.json({ deleted: count });
}
