import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageClasses } from "@/lib/rbac";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const service = await prisma.service.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({
      service: {
        ...service,
        price: Number(service.price),
      },
    });
  } catch (error) {
    console.error("GET service detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !canManageClasses(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const service = await prisma.service.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const updated = await prisma.service.update({
      where: { id: service.id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.shortDesc !== undefined && { shortDesc: body.shortDesc }),
        ...(body.fullDescription !== undefined && { fullDescription: body.fullDescription }),
        ...(body.durationMinutes !== undefined && { durationMinutes: Number(body.durationMinutes) }),
        ...(body.price !== undefined && { price: Number(body.price) }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
        ...(body.whatIncluded !== undefined && { whatIncluded: body.whatIncluded }),
        ...(body.whoIsThisFor !== undefined && { whoIsThisFor: body.whoIsThisFor }),
        ...(body.preparationTips !== undefined && { preparationTips: body.preparationTips }),
      },
    });

    revalidatePath("/");
    revalidatePath("/mentorship");
    if (slug) revalidatePath(`/mentorship/${slug}`);

    return NextResponse.json({
      message: "Service updated",
      service: {
        ...updated,
        price: Number(updated.price),
      },
    });
  } catch (error) {
    console.error("PUT service error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !canManageClasses(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const service = await prisma.service.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    await prisma.service.delete({
      where: { id: service.id },
    });

    revalidatePath("/");
    revalidatePath("/mentorship");
    if (slug) revalidatePath(`/mentorship/${slug}`);

    return NextResponse.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("DELETE service error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
