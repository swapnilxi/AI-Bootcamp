import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole, isInstructorRole } from "@/lib/roles";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const whereClause: Record<string, unknown> = {
      isPublished: true,
    };

    if (category && category !== "all") {
      whereClause.category = category;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const posts = await prisma.blogPost.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
            mentorType: true,
            specialties: true,
          },
        },
      },
      orderBy: { publishedAt: "desc" },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("GET /api/blog error:", error);
    return NextResponse.json({ error: "Failed to fetch blog posts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    if (!isAdminRole(userRole) && !isInstructorRole(userRole)) {
      return NextResponse.json({ error: "Forbidden: Only faculty and admins can publish articles" }, { status: 403 });
    }

    const body = await req.json();
    const { title, slug, excerpt, content, category, tags, readTimeMin } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({ error: "Title, slug, and content are required" }, { status: 400 });
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt: excerpt || title,
        content,
        category: category || "AI Engineering",
        tags: tags || "",
        readTimeMin: readTimeMin ? Number(readTimeMin) : 5,
        authorId: session.user.id,
        isPublished: true,
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/blog error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "An article with this slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create blog post" }, { status: 500 });
  }
}
