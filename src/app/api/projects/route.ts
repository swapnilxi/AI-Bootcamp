import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole, isInstructorRole } from "@/lib/roles";

/** Lists projects — for instructor/admin tooling (e.g. the lesson generator's project picker). */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isInstructorRole(session?.user?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const pathId = searchParams.get("pathId");
  const isAdmin = isAdminRole(session?.user?.role);

  const projects = await prisma.project.findMany({
    where: {
      ...(pathId ? { pathId } : {}),
      ...(isAdmin ? {} : { status: "PUBLISHED" }),
    },
    orderBy: { order: "asc" },
    select: { id: true, slug: true, title: true, pathId: true, difficulty: true },
  });

  return NextResponse.json({ projects });
}
