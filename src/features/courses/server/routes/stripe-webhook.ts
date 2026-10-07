import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { constructWebhookEvent } from "../payments/stripe";

/**
 * Stripe webhook. This is the only thing that grants a paid entitlement — the
 * browser returning from Checkout proves nothing.
 *
 * The route must read the raw body for signature verification, so it cannot use
 * `req.json()`. Point Stripe at POST /api/webhooks/stripe, e.g. locally:
 *   stripe listen --forward-to localhost:3006/api/webhooks/stripe
 */
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(await req.text(), signature);
  } catch (error) {
    // A bad signature is a client error — never trust the payload.
    console.error("Stripe webhook verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await grantFromSession(event.data.object);
    }
    // Everything else is acknowledged so Stripe stops retrying.
    return NextResponse.json({ received: true });
  } catch (error) {
    // 500 asks Stripe to retry; the upsert below makes that safe.
    console.error("Stripe webhook handling failed:", event.type, error);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}

async function grantFromSession(s: Stripe.Checkout.Session): Promise<void> {
  if (s.payment_status !== "paid") return;

  const userId = s.metadata?.userId || s.client_reference_id || undefined;
  const courseId = s.metadata?.courseId || undefined;
  if (!userId || !courseId) {
    console.error("Stripe session missing userId/courseId metadata:", s.id);
    return;
  }

  // Both rows are written together: a paid seat that failed to enrol would look
  // to the student exactly like a payment that vanished.
  await prisma.$transaction(async (tx) => {
    await tx.entitlement.upsert({
      where: { userId_courseId: { userId, courseId } },
      // Replaying the same event must not create a second grant.
      create: {
        userId,
        courseId,
        source: "stripe",
        amountPaid: s.amount_total ?? null,
        currency: s.currency ?? null,
        providerRef: s.id,
      },
      update: { providerRef: s.id },
    });

    await tx.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, unlockedWithPassword: false },
      update: {},
    });
  });
}
