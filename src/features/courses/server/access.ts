import "server-only";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import { canManageClass, isAdminRole, isSubscriberRole } from "@/lib/roles";

interface AccessClass {
  id: string;
  instructorId: string;
  isPasswordProtected: boolean;
  isSubscriberOnly: boolean;
}

export interface ClassAccess {
  isEnrolled: boolean;
  unlockedWithPassword: boolean;
  /** Teaching instructor or admin: may edit the class and its lessons. */
  canManage: boolean;
  /** May read full class content and every lesson. */
  canViewContent: boolean;
}

/**
 * An instructor whose own profile is pending or rejected must not keep authoring
 * rights. Admins are always allowed, and are never gated on their own profile.
 */
async function instructorIsApproved(userId: string): Promise<boolean> {
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { approvalStatus: true },
  });
  return me?.approvalStatus === "APPROVED";
}

/** Single source of truth for who can see and manage a class's materials. */
export async function getClassAccess(
  session: Session | null,
  cls: AccessClass
): Promise<ClassAccess> {
  const userId = session?.user?.id;
  const role = session?.user?.role;

  let isEnrolled = false;
  let unlockedWithPassword = false;
  if (userId) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: cls.id } },
    });
    if (enrollment) {
      isEnrolled = true;
      unlockedWithPassword = enrollment.unlockedWithPassword;
    }
  }

  let canManage = canManageClass(role, userId, cls.instructorId);
  // A teaching instructor only keeps authoring rights while their own profile is
  // approved; administrators are exempt from that check.
  if (canManage && userId && !isAdminRole(role)) {
    canManage = await instructorIsApproved(userId);
  }

  let canViewContent: boolean;
  if (canManage) {
    canViewContent = true;
  } else if (cls.isPasswordProtected) {
    canViewContent = isEnrolled && unlockedWithPassword;
  } else if (cls.isSubscriberOnly) {
    canViewContent = isEnrolled && isSubscriberRole(role);
  } else {
    canViewContent = isEnrolled;
  }

  return { isEnrolled, unlockedWithPassword, canManage, canViewContent };
}

/**
 * Convenience guard for route handlers: resolves access and throws a typed
 * refusal when the caller may not manage the class.
 */
export async function assertClassManageable(
  session: Session | null,
  cls: AccessClass
): Promise<ClassAccess> {
  const access = await getClassAccess(session, cls);
  if (!access.canManage) {
    throw new ClassAccessError(
      "Forbidden: Only this class's instructor or an administrator can modify it",
      403
    );
  }
  return access;
}

export class ClassAccessError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ClassAccessError";
  }
}
