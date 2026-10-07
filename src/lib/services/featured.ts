import { prisma } from "@/lib/prisma";
import type { IconName } from "@/components/ui/Icon";
import { DEFAULT_SERVICES, type ServiceItem } from "@/content/home";

const FEATURED_COUNT = 3;

/** Picks a line icon for a path from its slug. */
function iconForPath(slug: string): IconName {
  if (slug.includes("agent")) return "network";
  if (slug.includes("genai") || slug.includes("generative")) return "career";
  return "path";
}

/**
 * The learning paths shown on the homepage, in curriculum order. Falls back to
 * the static defaults when the database is unreachable (e.g. at build time).
 */
export async function getFeaturedServices(): Promise<ServiceItem[]> {
  try {
    const rows = await prisma.learningPath.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      take: FEATURED_COUNT,
      select: {
        id: true,
        slug: true,
        title: true,
        tagline: true,
        description: true,
        estimatedWeeks: true,
        difficulty: true,
      },
    });

    if (rows.length > 0) {
      return rows.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        shortDesc: p.description,
        // `price` and `durationMinutes` are carried by the shared card shape;
        // for a path the meaningful number is its length in weeks.
        price: 0,
        durationMinutes: p.estimatedWeeks,
        category: p.difficulty,
        iconName: iconForPath(p.slug),
      }));
    }
  } catch (error) {
    console.warn("Could not load learning paths from database, using defaults:", error);
  }

  return DEFAULT_SERVICES;
}
