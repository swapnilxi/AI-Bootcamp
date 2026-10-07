import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { rateLimit } from "@/lib/rate-limit";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const parsed = loginSchema.safeParse({
          email: credentials.email,
          password: credentials.password,
        });

        if (!parsed.success) {
          throw new Error("Invalid email or password format");
        }

        const normalizedEmail = parsed.data.email.toLowerCase().trim();

        // Rate limit login attempts per email (max 5 attempts per 2 minutes)
        const limiter = await rateLimit(`login:${normalizedEmail}`, {
          limit: 5,
          windowMs: 2 * 60 * 1000,
        });

        if (!limiter.success) {
          throw new Error("Too many failed login attempts. Please try again in 2 minutes.");
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(parsed.data.password, user.password);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.avatarUrl = user.avatarUrl;
      }

      // Keep the role in sync with the database (throttled to once a minute) so
      // role changes such as promotion to INSTRUCTOR apply without logging out.
      const now = Date.now();
      const lastSync = (token.roleSyncedAt as number | undefined) ?? 0;
      if (!user && token.id && now - lastSync > 60_000) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true },
        });
        if (fresh) token.role = fresh.role;
        token.roleSyncedAt = now;
      }
      if (user) token.roleSyncedAt = now;

      // Allow client-side update of session without relogging
      if (trigger === "update" && session?.user) {
        if (session.user.role) token.role = session.user.role;
        if (session.user.name) token.name = session.user.name;
        if (session.user.avatarUrl) token.avatarUrl = session.user.avatarUrl;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.avatarUrl = token.avatarUrl;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "ai-bootcamp-fallback-secret-2026",
};
