import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageClass } from "@/lib/roles";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { isClassOpenForEnrollment } from "../entitlements";
import {
  StripeNotConfiguredError,
  createClassCheckoutSession,
  isStripeConfigured,
} from "../payments/stripe";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Start a Stripe Checkout session for a paid class and hand the client the URL
 * to redirect to. The entitlement is written by the webhook once Stripe confirms
 * payment — never here, because this response proves nothing about payment.
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please log in to purchase this class" }, { status: 401 });
    }

    const limiter = await rateLimit(`class-checkout:${session.user.id}:${getClientIp(req)}`, {
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please wait a few minutes." },
        { status: 429 }
      );
    }

    const cls = await prisma.course.findUnique({ where: { id } });
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    const price = Number(cls.price);
    const canManage = canManageClass(session.user.role, session.user.id, cls.instructorId);

    if (!isClassOpenForEnrollment({ ...cls, price }, canManage)) {
      return NextResponse.json({ error: "This class is not open for enrollment" }, { status: 403 });
    }
    if (price <= 0) {
      return NextResponse.json({ error: "This class is free — just enroll." }, { status: 400 });
    }
    if (canManage) {
      return NextResponse.json({ error: "You already have access to this class." }, { status: 400 });
    }

    // Don't charge twice for the same seat.
    const [already, enrolled] = await Promise.all([
      prisma.entitlement.findUnique({
        where: { userId_courseId: { userId: session.user.id, courseId: cls.id } },
        select: { id: true },
      }),
      prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: session.user.id, courseId: cls.id } },
        select: { id: true },
      }),
    ]);
    if (already || enrolled) {
      return NextResponse.json({ error: "You already have access to this class." }, { status: 409 });
    }

    // Checked last, so a free class or an existing seat gets its own clear answer
    // rather than a misleading "payments not configured".
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: new StripeNotConfiguredError().message }, { status: 503 });
    }

    const base = appUrl();
    const checkout = await createClassCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email,
      courseId: cls.id,
      classTitle: cls.title,
      price,
      successUrl: `${base}/classes/${cls.id}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${base}/classes/${cls.id}?purchase=cancelled`,
    });

    if (!checkout.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL" }, { status: 502 });
    }
    return NextResponse.json({ checkoutUrl: checkout.url, sessionId: checkout.id });
  } catch (error) {
    if (error instanceof StripeNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Class checkout error:", error);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }
}
