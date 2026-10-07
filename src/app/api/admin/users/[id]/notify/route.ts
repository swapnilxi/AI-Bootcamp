import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { notifyUser } from "@/lib/notify";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const schema = z.object({
  subject: z.string().trim().min(2, "Add a subject").max(120),
  message: z.string().trim().min(2, "Write a message").max(2000),
  channels: z.array(z.enum(["EMAIL", "WHATSAPP"])).min(1, "Choose at least one channel").max(2),
});

/** Admin: send a direct email/WhatsApp message to a user. */
export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid request" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, phone: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const result = await notifyUser(
    user,
    { subject: parsed.data.subject, body: parsed.data.message },
    parsed.data.channels,
    session.user.id
  );
  return NextResponse.json(result);
}
