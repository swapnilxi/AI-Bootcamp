/**
 * Classes feature — server-only surface. Never import this from a client
 * component: it pulls in Prisma and NextAuth.
 */
import "server-only";

export { getClassAccess, assertClassManageable } from "./access";
export type { ClassAccess } from "./access";
export { hasClassEntitlement, isClassOpenForEnrollment } from "./entitlements";
