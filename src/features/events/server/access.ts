import { Role } from "@prisma/client";
import { isAdminRole, isInstructorRole } from "@/lib/roles";

/**
 * Who may host an event. Instructors, admins and super admins can all create
 * events; members can only *request* one and express interest.
 */
export function canHostEvents(role?: Role | string | null): boolean {
    return isInstructorRole(role as string | undefined);
}

/**
 * Only admins gate visibility: an instructor's event stays private until an
 * admin approves it. Super admins approve directly without needing a second
 * pair of eyes, matching the classes feature.
 */
export function canApproveEvents(role?: Role | string | null): boolean {
    return isAdminRole(role as string | undefined);
}

/** Admins manage every event; instructors only the ones they host. */
export function canManageEvent(
    role: Role | string | null | undefined,
    userId: string | null | undefined,
    hostId: string
): boolean {
    if (canApproveEvents(role as string | undefined)) return true;
    return isInstructorRole(role as string | undefined) && !!userId && userId === hostId;
}