import { Role } from "@prisma/client";
import { ROLE_HIERARCHY, hasRoleOrHigher as hasRole, canManageClass, canCreateClasses } from "./roles";

export { ROLE_HIERARCHY, canManageClass, canCreateClasses };

export function hasRoleOrHigher(userRole: Role | undefined | null, requiredRole: Role): boolean {
  return hasRole(userRole, requiredRole);
}

export function isSubscriber(role?: Role | null): boolean {
  return hasRoleOrHigher(role, Role.SUBSCRIBER);
}

export function isInstructor(role?: Role | null): boolean {
  return hasRoleOrHigher(role, Role.INSTRUCTOR);
}

export function isAdmin(role?: Role | null): boolean {
  return hasRoleOrHigher(role, Role.ADMIN);
}

export function isSuperAdmin(role?: Role | null): boolean {
  return role === Role.SUPER_ADMIN;
}

/** Admin-level: manage every class regardless of instructor. */
export function canManageClasses(role?: Role | null): boolean {
  return isAdmin(role);
}

export function canManageUsers(role?: Role | null): boolean {
  return isAdmin(role);
}

export function canAssignRoles(role?: Role | null): boolean {
  return isSuperAdmin(role);
}

export function canAccessSubscriberContent(role?: Role | null): boolean {
  return isSubscriber(role);
}
