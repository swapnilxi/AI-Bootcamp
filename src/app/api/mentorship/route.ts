import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageClasses } from "@/lib/rbac";
import { z } from "zod";

const createServiceSchema = z.object({
  title: z.string().min(3).max(120),
  shortDesc: z.string().min(10).max(300),
  fullDescription: z.string().min(20),
  durationMinutes: z.coerce.number().min(15).max(180).default(60),
  price: z.coerce.number().min(0).default(0),
  category: z.string().default("General"),
  whatIncluded: z.array(z.string()).default([]),
  whoIsThisFor: z.array(z.string()).default([]),
  preparationTips: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const whereClause: Record<string, unknown> = {
      isActive: true,
    };

    if (category && category !== "All") {
      whereClause.category = category;
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      orderBy: { price: "desc" },
    });

    const formatted = services.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      shortDesc: s.shortDesc,
      fullDescription: s.fullDescription,
      durationMinutes: s.durationMinutes,
      price: Number(s.price),
      category: s.category,
      whatIncluded: s.whatIncluded,
      whoIsThisFor: s.whoIsThisFor,
      preparationTips: s.preparationTips,
    }));

    return NextResponse.json({ services: formatted });
  } catch (error) {
    console.error("GET services error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !canManageClasses(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = createServiceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", issues: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;
    const slugBase = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${slugBase}-${randomSuffix}`;

    const newService = await prisma.service.create({
      data: {
        slug,
        title: data.title,
        shortDesc: data.shortDesc,
        fullDescription: data.fullDescription,
        durationMinutes: data.durationMinutes,
        price: data.price,
        category: data.category,
        whatIncluded: data.whatIncluded,
        whoIsThisFor: data.whoIsThisFor,
        preparationTips: data.preparationTips,
      },
    });

    revalidatePath("/");
    revalidatePath("/mentorship");

    return NextResponse.json(
      { message: "Service created successfully", service: newService },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST service error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
