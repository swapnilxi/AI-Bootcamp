import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bio: true,
            role: true,
            mentorType: true,
            specialties: true,
          },
        },
      },
    });

    if (!post || !post.isPublished) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Get related articles in same category
    const relatedPosts = await prisma.blogPost.findMany({
      where: {
        isPublished: true,
        category: post.category,
        id: { not: post.id },
      },
      take: 3,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        readTimeMin: true,
        publishedAt: true,
      },
    });

    return NextResponse.json({ post, relatedPosts });
  } catch (error) {
    console.error("GET /api/blog/[slug] error:", error);
    return NextResponse.json({ error: "Failed to fetch article" }, { status: 500 });
  }
}
