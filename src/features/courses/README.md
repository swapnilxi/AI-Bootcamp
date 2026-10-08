# Courses feature

Self-contained course catalog: classes, lessons, enrolment, access keys and
progress. Everything the feature owns lives under this folder; nothing outside
it reaches past the two entry points below.

## Layout

```
classes/
  index.ts            public, client-safe surface (components, hooks, schemas, types)
  server/index.ts     public, server-only surface (access checks, entitlements)
  types.ts            API response shapes, independent of Prisma
  routes.ts           every URL the feature calls, in one map
  schemas/            zod schemas, shared by client forms and server handlers
  components/         ClassCard, LessonManager, PasswordUnlockModal, InstructorSelect
  hooks/              useClasses
  server/
    access.ts         getClassAccess — who may read and manage a class
    entitlements.ts   who may enrol: approval, subscriber tier, payment
    routes/           the route handlers themselves
```

## Entry points

```ts
// Client components
import { ClassCard, useClasses, createClassSchema, CLASS_ROUTES } from "@/features/courses";

// Server only — pulls in Prisma and NextAuth
import { getClassAccess, hasClassEntitlement } from "@/features/courses/server";
```

Importing `@/features/courses/server` from a client component fails the build by
design: that module declares `server-only`.

## Mounting the routes

`src/app/api/courses/**/route.ts` are one-line adapters. The handlers live in
`server/routes/` so a host application can mount them under any prefix:

```ts
// app/api/courses/route.ts
export { GET, POST } from "@/features/courses/server/routes/classes";
```

Change the `base` constant in `routes.ts` to match, and the client stays in sync.

## What it expects from the host application

The feature is not framework-agnostic — it assumes Next.js App Router, Prisma
and NextAuth. It needs:

| Dependency | Used for |
| --- | --- |
| `@/lib/prisma` | `Class`, `Lesson`, `Enrollment`, `LessonProgress`, `User` models |
| `@/lib/auth` | NextAuth `authOptions`, and `session.user.{id,role}` |
| `@/lib/roles` | role hierarchy helpers (`canManageClass`, `isSubscriberRole`, …) |
| `@/lib/rate-limit` | throttling access-key attempts |
| `@/lib/ai/*` | optional — lesson drafting and the lesson assistant |
| `@/components/ui/Button` | the one shared UI primitive the components use |

Porting the feature elsewhere means supplying those five `@/lib` modules; the
feature's own files only import each other by relative path, so the folder can
be copied as a unit.

## Enrolment policy

| Caller                     | Free | Paid                  |
| -------------------------- | ---- | --------------------- |
| SUPER_ADMIN / ADMIN        | yes  | yes — staff bypass    |
| INSTRUCTOR, own class      | yes  | yes — they teach it   |
| INSTRUCTOR, someone else's | yes  | must pay              |
| SUBSCRIBER / USER          | yes  | must pay              |

Subscriber-only classes additionally require a subscription, whatever the price;
a subscription does **not** cover paid classes. All of this lives in
`server/entitlements.ts` and is the single gate used by both `/enroll` and
`/unlock`.

## Payments (Stripe Checkout)

A paid class is unlocked by a row in `Entitlement`. The only things that write
one are the Stripe webhook after a completed Checkout session, and an
administrator granting access by hand.

```
  POST /api/courses/[id]/checkout   -> { checkoutUrl }   (browser redirects)
  POST /api/webhooks/stripe         -> entitlement + enrollment, in one transaction
```

The browser returning to the success URL proves nothing and grants nothing; only
the signed webhook does. The webhook upserts on `(userId, classId)` and records
the Checkout Session id in `providerRef`, so a replayed event cannot double-grant.

### Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | to take payments | `sk_test_…` / `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | to take payments | `whsec_…`, from `stripe listen` or the dashboard |
| `STRIPE_CURRENCY` | optional | defaults to `usd` |
| `NEXT_PUBLIC_APP_URL` | optional | base for the success/cancel URLs |

With no key set, `/checkout` answers 503 and paid classes simply stay
unenrollable — nothing else in the app changes.

Locally:

```sh
stripe listen --forward-to localhost:3006/api/webhooks/stripe
```

### Using a different provider

The Stripe pieces are confined to `server/payments/stripe.ts` and the two routes
above. Everything else reads `Entitlement`. To swap the store entirely:

```ts
import { setPaidEntitlementResolver } from "@/features/courses/server/entitlements";

setPaidEntitlementResolver(async ({ userId }, cls) =>
  Boolean(await payments.hasPurchased(userId, cls.id))
);
```
