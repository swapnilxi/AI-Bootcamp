import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPushConfigured } from "@/lib/push/server";

const schema = z.object({ token: z.string().min(20).max(4096) });

/** Register this browser for push (called after the user grants permission). */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPushConfigured()) return NextResponse.json({ error: "Push is not configured on the server" }, { status: 503 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid token" }, { status: 400 });

  // A token belongs to one browser profile; if another account used it before, it moves to this user.
  await prisma.pushToken.upsert({
    where: { token: parsed.data.token },
    create: { token: parsed.data.token, userId: session.user.id, userAgent: req.headers.get("user-agent")?.slice(0, 250) },
    update: { userId: session.user.id, lastUsedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}

/** Unregister this browser (user turned alerts off). Only deletes the caller's own token. */
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  await prisma.pushToken.deleteMany({ where: { token: parsed.data.token, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
