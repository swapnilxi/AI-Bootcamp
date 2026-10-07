import { prisma } from "@/lib/prisma";

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

// In-memory fallback map for speed and zero-latency resilience
const memoryStore = new Map<string, { count: number; expiresAt: number }>();

export async function rateLimit(
  key: string,
  config: RateLimitConfig = { limit: 5, windowMs: 60 * 1000 }
): Promise<{ success: boolean; remaining: number; resetAt: Date }> {
  const now = Date.now();
  const expiresAt = new Date(now + config.windowMs);

  try {
    // 1. Try DB-backed rate limiting (distributed/persisted across instances)
    const existing = await prisma.rateLimitRecord.findUnique({
      where: { key },
    });

    if (!existing || existing.expiresAt.getTime() <= now) {
      await prisma.rateLimitRecord.upsert({
        where: { key },
        create: {
          key,
          count: 1,
          expiresAt,
        },
        update: {
          count: 1,
          expiresAt,
        },
      });

      return {
        success: true,
        remaining: config.limit - 1,
        resetAt: expiresAt,
      };
    }

    if (existing.count >= config.limit) {
      return {
        success: false,
        remaining: 0,
        resetAt: existing.expiresAt,
      };
    }

    const updated = await prisma.rateLimitRecord.update({
      where: { key },
      data: {
        count: { increment: 1 },
      },
    });

    return {
      success: true,
      remaining: Math.max(0, config.limit - updated.count),
      resetAt: updated.expiresAt,
    };
  } catch (error) {
    // 2. In-memory fallback if DB is initializing or offline
    const record = memoryStore.get(key);

    if (!record || record.expiresAt <= now) {
      memoryStore.set(key, { count: 1, expiresAt: now + config.windowMs });
      return {
        success: true,
        remaining: config.limit - 1,
        resetAt: new Date(now + config.windowMs),
      };
    }

    if (record.count >= config.limit) {
      return {
        success: false,
        remaining: 0,
        resetAt: new Date(record.expiresAt),
      };
    }

    record.count += 1;
    return {
      success: true,
      remaining: Math.max(0, config.limit - record.count),
      resetAt: new Date(record.expiresAt),
    };
  }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
