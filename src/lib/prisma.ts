import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Vercel's deployment filesystem is read-only. The committed SQLite file
// (prisma/dev.db) is copied to /tmp on cold start so reads and writes work.
// Note: writes on Vercel live in /tmp and are ephemeral per serverless instance.
if (process.env.VERCEL) {
  const target = "/tmp/ai-bootcamp.db";
  if (!fs.existsSync(target)) {
    const source = path.join(process.cwd(), "prisma", "dev.db");
    if (fs.existsSync(source)) fs.copyFileSync(source, target);
  }
  process.env.DATABASE_URL = `file:${target}`;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
