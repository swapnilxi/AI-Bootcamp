import { Role } from "@prisma/client";
import { DefaultSession, DefaultUser } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      avatarUrl?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: Role;
    avatarUrl?: string | null;
    roleSyncedAt?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    avatarUrl?: string | null;
    roleSyncedAt?: number;
  }
}
