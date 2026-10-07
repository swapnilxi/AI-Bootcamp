import "server-only";
import Stripe from "stripe";

/**
 * Stripe adapter for class purchases. Everything provider-specific lives here;
 * the rest of the feature only knows about `Entitlement` rows.
 *
 * Required to take payments:
 *   STRIPE_SECRET_KEY       sk_test_… / sk_live_…
 *   STRIPE_WEBHOOK_SECRET   whsec_… (from `stripe listen` or the dashboard)
 * Optional:
 *   STRIPE_CURRENCY         defaults to "usd"
 *
 * With no key configured the checkout route answers 503 and nothing else in the
 * app changes — paid classes simply stay unenrollable.
 */
let client: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new StripeNotConfiguredError();
  }
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

export class StripeNotConfiguredError extends Error {
  readonly status = 503;
  constructor() {
    super("Payments are not configured. Set STRIPE_SECRET_KEY to accept card payments.");
    this.name = "StripeNotConfiguredError";
  }
}

export const CURRENCY = (process.env.STRIPE_CURRENCY || "usd").toLowerCase();

/** Zero-decimal currencies take the amount as-is; everything else is ×100. */
const ZERO_DECIMAL = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga",
  "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
]);

/** Convert a class price (major units) to Stripe's smallest-unit integer. */
export function toMinorUnits(price: number, currency = CURRENCY): number {
  return ZERO_DECIMAL.has(currency) ? Math.round(price) : Math.round(price * 100);
}

export interface CheckoutParams {
  userId: string;
  userEmail?: string | null;
  courseId: string;
  classTitle: string;
  price: number;
  successUrl: string;
  cancelUrl: string;
}

/**
 * One-off Checkout session for a single class. `client_reference_id` and the
 * metadata carry the identifiers the webhook needs to write the entitlement.
 */
export async function createClassCheckoutSession(p: CheckoutParams): Promise<Stripe.Checkout.Session> {
  return stripe().checkout.sessions.create({
    mode: "payment",
    client_reference_id: p.userId,
    ...(p.userEmail ? { customer_email: p.userEmail } : {}),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: toMinorUnits(p.price),
          product_data: { name: p.classTitle },
        },
      },
    ],
    // Read back by the webhook — Stripe returns metadata verbatim.
    metadata: { userId: p.userId, courseId: p.courseId },
    success_url: p.successUrl,
    cancel_url: p.cancelUrl,
  });
}

/** Verify a webhook payload came from Stripe. Throws if the signature is bad. */
export function constructWebhookEvent(rawBody: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET must be set to verify Stripe webhooks");
  }
  return stripe().webhooks.constructEvent(rawBody, signature, secret);
}
