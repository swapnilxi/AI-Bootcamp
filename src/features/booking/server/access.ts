import "server-only";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Guest booking links are signed with their own secret, so leaking one never
 * weakens session cookies. `BOOKING_TOKEN_SECRET` is preferred; `NEXTAUTH_SECRET`
 * is accepted as a fallback, derived through a label so the two signing keys are
 * never literally the same value. There is deliberately no hardcoded default:
 * a missing secret is a configuration error, not something to paper over.
 */
let cachedKey: Buffer | null = null;

function signingKey(): Buffer {
  if (cachedKey) return cachedKey;

  const dedicated = process.env.BOOKING_TOKEN_SECRET;
  if (dedicated) {
    cachedKey = Buffer.from(dedicated, "utf8");
    return cachedKey;
  }

  const fallback = process.env.NEXTAUTH_SECRET;
  if (!fallback) {
    throw new Error(
      "BOOKING_TOKEN_SECRET (or NEXTAUTH_SECRET) must be set to sign booking access links"
    );
  }
  // Domain-separated from the session secret.
  cachedKey = crypto.createHmac("sha256", fallback).update("ai-bootcamp/booking-token/v1").digest();
  return cachedKey;
}

/**
 * Signed, unguessable token that lets a guest (no account) view and manage one
 * booking from their confirmation link or email.
 */
export function bookingAccessToken(bookingId: string): string {
  return crypto
    .createHmac("sha256", signingKey())
    .update(`booking:${bookingId}`)
    .digest("base64url")
    .slice(0, 32);
}

export function verifyBookingToken(bookingId: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const expected = bookingAccessToken(bookingId);
  const given = Buffer.from(token, "utf8");
  const want = Buffer.from(expected, "utf8");
  // timingSafeEqual throws on a length mismatch, so compare lengths first.
  return given.length === want.length && crypto.timingSafeEqual(given, want);
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

/** Unique, hard-to-guess reference like "MS-7KQ4XZ". */
export async function generateReferenceCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const bytes = crypto.randomBytes(6);
    const code = "MS-" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
    const exists = await prisma.booking.findUnique({ where: { referenceCode: code }, select: { id: true } });
    if (!exists) return code;
  }
  throw new Error("Could not generate a unique booking reference");
}

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

/** Link a guest can use to view/cancel their booking. */
export function manageBookingUrl(booking: { id: string; referenceCode: string }): string {
  return `${appUrl()}/book/confirmation?ref=${booking.referenceCode}&t=${bookingAccessToken(booking.id)}`;
}
