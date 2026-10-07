import "server-only";
import { prisma } from "@/lib/prisma";
import { isSubscriberRole } from "@/lib/roles";

export interface EntitlementClass {
  id: string;
  price: number;
  isSubscriberOnly: boolean;
  approvalStatus: string;
  isPublished: boolean;
}

export interface EntitlementContext {
  userId: string;
  role?: string | null;
  /** True when the caller is the teaching instructor or an administrator. */
  canManage: boolean;
}

export type EntitlementResolver = (
  ctx: EntitlementContext,
  cls: EntitlementClass
) => boolean | Promise<boolean>;

/**
 * Default: a paid class is unlocked by a row in `Entitlement`, whatever wrote it
 * — the Stripe webhook after a completed Checkout session, or an administrator
 * granting access by hand. An expired entitlement does not count.
 *
 * A host application with a different store replaces this wholesale:
 *
 *   setPaidEntitlementResolver(async ({ userId }, cls) =>
 *     Boolean(await payments.hasPurchased(userId, cls.id))
 *   );
 */
const entitlementTableResolver: EntitlementResolver = async ({ userId }, cls) => {
  const row = await prisma.entitlement.findUnique({
    where: { userId_courseId: { userId, courseId: cls.id } },
    select: { expiresAt: true },
  });
  if (!row) return false;
  return !row.expiresAt || row.expiresAt.getTime() > Date.now();
};

let paidResolver: EntitlementResolver = entitlementTableResolver;

export function setPaidEntitlementResolver(resolver: EntitlementResolver): void {
  paidResolver = resolver;
}

export type EntitlementResult =
  | { ok: true }
  | {
      ok: false;
      status: number;
      error: string;
      requiresPassword?: boolean;
      /** The caller must complete checkout before enrolling. */
      requiresPayment?: boolean;
    };

/** A class can only be enrolled in once it is approved and published. */
export function isClassOpenForEnrollment(cls: EntitlementClass, canManage: boolean): boolean {
  return canManage || (cls.approvalStatus === "APPROVED" && cls.isPublished);
}

/**
 * Whether `ctx` may hold a seat in `cls`, independent of any password check.
 *
 * The enrolment policy, in precedence order:
 *
 * | Caller                        | Free | Paid                      |
 * | ----------------------------- | ---- | ------------------------- |
 * | SUPER_ADMIN / ADMIN           | yes  | yes — staff bypass        |
 * | INSTRUCTOR, own class         | yes  | yes — they teach it       |
 * | INSTRUCTOR, someone else's    | yes  | must pay, like anyone     |
 * | SUBSCRIBER / USER             | yes  | must pay                  |
 *
 * Subscriber-only classes additionally require a subscription, whatever the
 * price. "Must pay" means the host application's resolver has to confirm an
 * entitlement; with none registered the answer is 402.
 */
export async function hasClassEntitlement(
  ctx: EntitlementContext,
  cls: EntitlementClass
): Promise<EntitlementResult> {
  if (!isClassOpenForEnrollment(cls, ctx.canManage)) {
    return { ok: false, status: 403, error: "This class is not open for enrollment" };
  }

  // Instructors and admins always reach their own material.
  if (ctx.canManage) return { ok: true };

  if (cls.isSubscriberOnly && !isSubscriberRole(ctx.role)) {
    return {
      ok: false,
      status: 403,
      error:
        "Forbidden: This course is reserved exclusively for AI Subscribers. Please upgrade your subscription.",
    };
  }

  if (cls.price > 0) {
    const entitled = await paidResolver(ctx, cls);
    if (!entitled) {
      return {
        ok: false,
        status: 402,
        error: "This class requires payment before you can enroll.",
        requiresPayment: true,
      };
    }
  }

  return { ok: true };
}
