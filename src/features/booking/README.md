# Booking feature

Self-contained consultation booking: availability, slot resolution, booking
lifecycle (approve, reschedule, cancel, complete) and client notifications.

## Layout

```
booking/
  index.ts            public, client-safe surface (components, schemas, time helpers)
  server/index.ts     public, server-only surface (availability, settings, tokens)
  types.ts            API response shapes, independent of Prisma
  routes.ts           every URL the feature calls, in one map
  schemas/booking.ts  zod schemas for create, client actions and admin actions
  components/         SlotPicker, PractitionerBookingModal
  lib/time.ts         pure Intl timezone helpers — no server dependency
  server/
    availability.ts   slot generation, resolution and the concurrency guard
    access.ts         signed guest links and reference codes
    settings.ts       practice timezone, lead time, buffer, approval mode
    serialize.ts      public booking shape
    routes/           the route handlers themselves
```

## Entry points

```ts
// Client components
import { SlotPicker, formatInZone, BOOKING_ROUTES } from "@/features/booking";

// Server only
import { resolveSlot, getBookingSettings, bookingAccessToken } from "@/features/booking/server";
```

The server barrel re-exports the pure time helpers too, so server code never has
to reach through the client barrel and drag React components with it.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `BOOKING_TOKEN_SECRET` | preferred | signs guest booking links |
| `NEXTAUTH_SECRET` | fallback | used via a domain-separated HMAC if the above is unset |
| `PRACTICE_TIMEZONE` | optional | default practice timezone (`America/New_York`) |
| `NEXT_PUBLIC_APP_URL` | optional | base URL in emailed booking links |

There is no hardcoded fallback secret: if neither secret is set, signing throws
rather than silently using a guessable key.

Runtime settings (timezone, approval mode, lead time, booking horizon, buffer)
live in the `PlatformSetting` table and are read through `getBookingSettings()`.

## Concurrency

`resolveSlot()` reads availability; the write happens a moment later. Every
write path therefore re-checks inside a transaction via `assertSlotStillFree()`
and throws `SlotTakenError` (HTTP 409) if the slot went in the meantime.

SQLite cannot express an exclusion constraint over a time range, so this guard is
the only thing preventing a double booking. On a database that supports it, add
a range-exclusion constraint as a second line of defence.

## What it expects from the host application

| Dependency | Used for |
| --- | --- |
| `@/lib/prisma` | `Booking`, `Service`, `AvailabilitySlot`, `BlockedDate`, `PlatformSetting`, `NotificationLog` |
| `@/lib/auth` | NextAuth `authOptions` |
| `@/lib/roles` | distinguishing admin / practitioner / client |
| `@/lib/rate-limit` | throttling booking creation |
| `@/lib/notify` | email and WhatsApp delivery |
