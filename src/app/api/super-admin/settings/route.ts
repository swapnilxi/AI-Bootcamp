import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/rbac";
import { z } from "zod";

const settingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !isSuperAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Super Administrator access required" },
        { status: 403 }
      );
    }

    const settings = await prisma.platformSetting.findMany();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("GET settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !isSuperAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Super Administrator access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = settingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid setting parameters" }, { status: 400 });
    }

    const { key, value } = result.data;

    const setting = await prisma.platformSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });

    return NextResponse.json({
      message: "Platform setting updated",
      setting,
    });
  } catch (error) {
    console.error("POST setting error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
