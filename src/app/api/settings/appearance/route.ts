import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACCENT_COLORS } from "@/lib/accent";

async function requireUserId(): Promise<string | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  return session.user.id;
}

/** The signed-in user's saved accent color. */
export async function GET() {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { accentColor: true } });
  return NextResponse.json({ accentColor: user?.accentColor || "orange" });
}

const patchSchema = z.object({ accentColor: z.enum(ACCENT_COLORS) });

/** Save the signed-in user's chosen accent color. */
export async function PATCH(req: Request) {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid accent color" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: userId }, data: { accentColor: parsed.data.accentColor } });
  return NextResponse.json({ accentColor: parsed.data.accentColor });
}
