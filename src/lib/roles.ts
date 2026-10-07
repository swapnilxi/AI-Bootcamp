// Pure role helpers with no Prisma import, so they are safe in client components and edge middleware.

export type RoleName = "USER" | "SUBSCRIBER" | "INSTRUCTOR" | "ADMIN" | "SUPER_ADMIN";

export const ROLE_HIERARCHY: Record<RoleName, number> = {
  USER: 1,
  SUBSCRIBER: 2,
  INSTRUCTOR: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
};

export function hasRoleOrHigher(role: string | undefined | null, required: RoleName): boolean {
  if (!role || !(role in ROLE_HIERARCHY)) return false;
  return ROLE_HIERARCHY[role as RoleName] >= ROLE_HIERARCHY[required];
}

/** Subscribers and every staff role can access subscriber-only content. */
export const isSubscriberRole = (role?: string | null) => hasRoleOrHigher(role, "SUBSCRIBER");
export const isInstructorRole = (role?: string | null) => hasRoleOrHigher(role, "INSTRUCTOR");
export const isAdminRole = (role?: string | null) => hasRoleOrHigher(role, "ADMIN");

/** Instructors, admins and super admins can create classes. */
export const canCreateClasses = isInstructorRole;

/** Admins manage every class; instructors manage only classes they teach. */
export function canManageClass(
  role: string | undefined | null,
  userId: string | undefined | null,
  instructorId: string
): boolean {
  if (isAdminRole(role)) return true;
  return isInstructorRole(role) && !!userId && userId === instructorId;
}
