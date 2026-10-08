# AI Bootcamp – Todo & Roadmap

> **Migration note (2026-10-08):** this project used to be an astrology platform; it has fully migrated to
> an AI Engineering School ("Learn AI. Build AI. Ship AI.") — Python, ML, GenAI, RAG, agents, production AI.
> "Instructors" are now AI engineering faculty/mentors, not healers. The content is clean (verified by a
> repo-wide grep for `zodiac|horoscope|astrology` → zero matches), but a handful of leftover placeholder
> strings from the old theme were found and fixed this session (see below). This file has also been swept
> for stale names: the former "classes" feature is `src/features/courses` in code, `AdminPractitioners` is
> `AdminMentors.tsx`, and `PractitionerBookingModal` is `MentorBookingModal.tsx` — the items below use the
> current names.

## 🆕 This session (2026-10-08) — UI polish pass
Scope was explicitly "UI/Look & Feel + UI Enrichments", styled cream/ivory + orange glow, built on the
existing design system (`editorial-card`/`card-premium` rim glow, `.text-shimmer`, `.btn-sheen`) rather than
a new one.
1. **[DONE]** `Avatar` component (`src/components/ui/Avatar.tsx`): `next/image` + initials fallback, optional orange
      glow ring. Replaced every raw `<img>` in the app (8 call sites across 7 files, incl. `ClassCard`) —
      confirmed zero `<img>` tags remain outside `Avatar.tsx` itself
2. **[DONE]** Shared `Toast` system (`src/components/ui/Toast.tsx`): success/error/info, portal + `aria-live`,
      styled as an `editorial-card` with a one-time rim glint on arrival. Wired into `Providers.tsx`;
      replaced every bare `alert()` in the app (`AdminMentors`, `AdminClassesReview`, instructor dashboard,
      `courses/[id]`) — confirmed zero `alert(` calls remain
3. **[DONE]** `Skeleton` / `SkeletonCard` / `SkeletonAvatarCard` / `SkeletonStat` / `SkeletonGrid`
      (`src/components/ui/Skeleton.tsx`) with a cream/orange sweep (respects reduced-motion). Wired into
      `/instructors` and `/courses` client loading states
4. **[DONE]** `loading.tsx` + `error.tsx` (`role="alert"`, retry button) for `courses`, `instructors`, `my-bookings`,
      `book`, `(dashboard)/dashboard`, `profile` — built on shared `RouteFallback.tsx`; none of these six
      existed before this session
5. **[DONE]** Shared accessible `Modal` (`src/components/ui/Modal.tsx`): portal, `role="dialog"`/`aria-modal`,
      Escape, backdrop click, focus trap + restore, scroll lock (pauses Lenis via `useSmoothScroll`,
      matching `EditorialHeader`'s mobile-menu convention), `inert` on page siblings. Adopted by
      `PasswordUnlockModal`, `InstructorAiChatModal`, and `MentorBookingModal` — **not yet** by the profile
      `TemplatePicker`, `MobileMenu`, or the admin `Drawer` (each still hand-rolls its own overlay)
6. **[DONE]** `EmptyState` primitive gained an `icon` slot; wired real icons into `/labs`, `/projects`, `/paths`,
      `/bootcamp`'s empty states
7. **[DONE]** Fixed leftover astrology-era placeholder copy: login subtitle ("birth charts" →
      "sessions, progress, and courses"), `AccountMenu` label ("Profile & Birth Chart" → "Profile &
      Settings"), instructor-profile stat ribbon ("Charts & Biofield Scans" / "Sacred Confidentiality" →
      "Mentoring Sessions" / "Session Confidentiality"), an "Axiom II" card ("Subtle Biofield Priority" →
      "Failure Modes Before Features"), and the AI Twin's default greeting/sample-chat text (no more
      "Namaste"/nakshatras/biofield language)
8. **[DONE]** Verified: `npx tsc --noEmit`, `npx next lint`, and `npm run build` all pass clean; smoke-tested
      `/`, `/instructors`, `/courses`, `/profile` on an isolated dev port (confirmed skeleton markup in the
      SSR payload, no 500s)
9. **[DONE]** **Light-mode bug fix** (reported via screenshot on `/practice` and `/progress`): `.card-premium` and
      `.card-featured` (`src/styles/cards.css`) had a hardcoded near-black "glass" fill
      (`rgba(31,29,27,...)`/`rgba(16,15,14,...)`) that never flipped for light mode, so theme-aware dark text
      sat on a still-dark card → unreadable. Added `--card-glass-top-rgb-ch` / `--card-glass-bottom-rgb-ch`
      tokens (dark: near-black, light: near-white/cream) to `tokens.css` and pointed both gradients at them.
      Confirmed in the compiled production CSS that both light and dark values are present and wired in
10. **[DONE]** **Glow redesign** (reported via screenshot: orange glow wrapping every letter was unwanted):
      `.text-gold-metal`/`.text-shimmer` (`src/styles/effects.css`) used a 3-layer `0 0 Npx` text-shadow,
      which is a halo around each glyph. Replaced with a single offset+blur shadow (`0 2px 10px`, soft,
      one-directional) with a gentler hover bump (`0 2px 14px`) — confirmed in compiled CSS. `.neon-text`
      (travelling star / accent numerals) was left alone — not what was flagged
11. **[DONE]** Added **Montserrat** (`next/font/google`, weights 500/600/700, `font-heading` Tailwind token) and
      applied it to `CatalogueCard`'s title (the card heading shown in the glow screenshot) — scoped to that
      element rather than swapping the sitewide serif/sans pairing
12. **[DONE]** **Two more light-mode contrast bugs** (same root cause as the `card-premium`/`card-featured` fix —
      a hardcoded dark hex fill behind theme-aware text), found by proactively grepping for the pattern
      after the second report: `AccountMenu`'s dropdown panel (`bg-[#111114]/95`, `border-white/[0.0x]`
      dividers/hovers) and `MobileMenu`'s full-screen nav (`bg-[#0B0B0D]/[0.97]`, `border-white/[0.06]`).
      Both now use theme-aware tokens (`bg-black-raised`/`bg-black`, `border-black-line`, `hover:bg-cream/…`)
      — confirmed compiled correctly in an isolated build. **Not yet swept:** the same hardcoded-dark-hex
      pattern also appears in `instructors/[id]/page.tsx`, `instructors/page.tsx`, `AdminClassesReview.tsx`,
      `AdminMentors.tsx`, `admin/shared.tsx`, `InstructorAiChatModal.tsx`, `TutorWidget.tsx`, and
      `ProfileSectionsEditor.tsx` — some of these may be intentionally dark hero/chat treatments rather than
      bugs, so each needs a look rather than a blind find-replace
13. **[DONE]** Cards had no `:active` (press/click) state at all — hover already brightened the rim glow, but
      clicking (and tapping, where `:hover` doesn't reliably fire) gave no feedback. Added `.editorial-card:active`
      / `.card-premium:active` with a brighter, faster orange glow pulse
- **Follow-up pass (2026-10-08, later the same day):** closed 5 more open items (see #105, #108, #114, #118,
  #121 below for the full evidence) — `AccountMenu` closes on navigation; booking confirmation distinguishes
  a transient load error from a genuine 404 and offers retry; added `success`/`warning`/`danger`/`info`
  design tokens and fixed `StatusBadge` (PENDING and CANCELLED had been visually identical); instructor cards
  are now real stretched links (middle-click/open-in-new-tab work); root font-size is `106.25%` (scales with
  the visitor's browser preference, same visual size by default) and `color-scheme` is set per theme.
  Verified via an isolated build (`NEXT_DIST_DIR`), never touching the live dev server on :3006.
- Not done this pass, left for later: `Input/Select/Textarea/Toggle/Card/Alert/Badge/StatCard` primitives,
  a `loading` prop on `Button`, scoping the global 44px tap-target rule, `dvh`/`text-base`-on-mobile fixes,
  splitting the 1255-line `instructors/[id]/page.tsx`, migrating `MobileMenu`/`TemplatePicker`/admin `Drawer`
  onto the new `Modal`, and the hardcoded-dark-hex sweep across `instructors/[id]`, admin dashboards, and the
  AI chat/tutor widgets noted in the entry above

## ✅ Completed

14. **[DONE]** Click-to-open mentor profile from cards on /instructors
15. **[DONE]** AI Twin consultation modal (ReactMarkdown formatting, body scroll lock, isolated scroll — now via shared `Modal`)
16. **[DONE]** Custom profile sections editor (predefined templates + fully custom)
17. **[DONE]** Seed profiles for 3 distinct instructors (Maya Okonkwo, Dev Raman, Lena Fischer) end-to-end (courses, bookings, AI Twin, sections)
18. **[DONE]** Prisma schema: profileSections field on User
19. **[DONE]** Deployed to Vercel: https://ai-bootcamp.vercel.app
20. **[DONE]** **Courses & Booking extracted into self-contained features** under `src/features/` (see Architecture below) — the feature folder is named `src/features/courses` (not "classes"); its `README.md` heading was renamed from "Classes feature" to "Courses feature" this session

## 🧱 Architecture — modular features

Classes and Booking now live as self-contained features. Each folder owns its
types, schemas, components, hooks, server logic and route handlers, imports its
own files only by relative path, and exposes exactly two entry points.

```
src/features/<feature>/
  index.ts          public, client-safe surface
  server/index.ts   public, server-only surface (declares `server-only`)
  types.ts          API shapes, independent of Prisma
  routes.ts         every URL the feature calls, in one map
  schemas/          zod, shared by client forms and server handlers
  components/ hooks/
  server/routes/    the route handlers; src/app/api/** are one-line re-exports
  README.md         entry points, host dependencies, configuration
```

Rules that keep them portable:
- Nothing outside a feature imports past `@/features/x` or `@/features/x/server`.
- Server code never reaches through the client barrel (which carries React components).
- A feature's own files use relative imports, so the folder copies as a unit.
- Each README lists the five `@/lib` modules a host app must supply
  (`prisma`, `auth`, `roles`, `rate-limit`, `notify`).

### Remaining modularisation work
21. **[OPEN]** Apply the same treatment to **instructors/mentors** (`src/app/instructors/[id]/page.tsx`, 1255 lines — shrank some but still one monolith) and **blog** (`src/app/(marketing)/blog/**`, `src/app/api/blog/**`) — neither is extracted into `src/features/instructors` or `src/features/blog`
22. **[OPEN]** Extract the shared `@/components/ui` primitives a feature may depend on into a documented, versioned set — the folder has no README/versioning today
23. **[OPEN]** Add an ESLint `no-restricted-imports` rule banning deep `@/features/*/...` paths from outside each feature, so the barrels can't erode — `.eslintrc.json` is still just `{"extends": "next/core-web-vitals"}`
24. **[OPEN]** Per-feature tests (access rules, entitlement matrix, slot resolution, DST boundaries) that run without the Next.js app — **zero test files exist anywhere in the repo**, no test runner in `package.json`
25. **[OPEN]** Decide whether features graduate to workspace packages (`packages/courses`) once a second app needs them

## 🔜 Next Up
26. **[OPEN]** Image upload for instructor avatar — still no upload endpoint anywhere (`avatarUrl` is a plain URL text input on `/profile`). The `Avatar` component built this session (next/image + initials fallback) covers *display*, not upload — this item is about the upload flow itself
27. **[OPEN]** Gallery section support in ProfileSectionsRenderer (real images) — the zod schema already defines a `"gallery"` item kind with `imageUrl` (`src/lib/validations/profileSections.ts`), but `ProfileSectionsRenderer`'s render switch has no `"gallery"` case, so gallery items are silently dropped today
28. **[OPEN]** Drag-and-drop reordering for profile sections (react-beautiful-dnd or similar) — still `moveUp`/`moveDown` buttons, no dnd library installed
29. **[DONE]** ~~Seed more instructor profiles for the demo~~ — 3 distinct instructors seeded (Maya Okonkwo, Dev Raman, Lena Fischer)
30. **[DONE]** ~~Admin approval workflow UI polish~~ — rejection-reason modal, nudge counter, delivery-channel picker, and now toast feedback instead of `alert()`
31. **[DONE]** ~~Student / seeker dashboard improvements~~ — `dashboard/user` is a real server-rendered dashboard: enrollments, per-course completion %, stat tiles, learner snapshot
32. **[OPEN]** Email notification templates — booking-lifecycle templates exist with real SMTP/WhatsApp sending (`src/lib/notify/`), but there's no password-reset or welcome/onboarding email template

## 🔒 Security (from code review, 2026-10-04; re-audited 2026-10-08)

_Items struck through were fixed on 2026-10-05 alongside the features refactor._

33. **[OPEN]** **Role forgery**: remove `session.user.role` handling from the `trigger === "update"` branch in `src/lib/auth.ts` (any user can self-promote to SUPER_ADMIN) — still present at `src/lib/auth.ts:97-99`, confirmed unfixed
34. **[DONE]** ~~Booking tokens: removed the hardcoded fallback secret~~ — `features/booking/server/access.ts` now uses `BOOKING_TOKEN_SECRET`, or a domain-separated HMAC of `NEXTAUTH_SECRET`, and throws if neither is set
35. **[OPEN]** Remove the same hardcoded fallback secret from `src/lib/auth.ts` and throw if `NEXTAUTH_SECRET` is unset *(left alone: changing it invalidates live sessions — do it with a deploy window)* — still `secret: process.env.NEXTAUTH_SECRET || "ai-bootcamp-fallback-secret-2026"` at `src/lib/auth.ts:114`
36. **[OPEN]** Login: validate `callbackUrl` (same-origin paths only) – open redirect in `src/app/(auth)/login/page.tsx` — confirmed: `callbackUrl` from `searchParams` is passed straight to `router.push()` with no same-origin check
37. **[OPEN]** Login: hide demo credentials (incl. admin password) in production — still rendered unconditionally, no `NODE_ENV` gate
38. **[DONE]** ~~`/api/classes/[id]/unlock`~~ — now requires a session, runs the full entitlement check, never returns `content` to anonymous callers, no longer leaks materials for non-protected classes, and rate-limits per account+IP
39. **[DONE]** ~~`/api/classes/[id]/enroll`~~ — gated behind `hasClassEntitlement()`; paid classes return **402** unless the host app registers a resolver (`setPaidEntitlementResolver`)
40. **[DONE]** ~~Wire a real payment provider~~ — Stripe Checkout + webhook, `Entitlement` table, enforced enrolment policy (see below)
41. **[OPEN]** **Heads-up:** booking tokens are now derived from a new key, so any guest `?t=` link emailed before 2026-10-05 no longer verifies. Set `BOOKING_TOKEN_SECRET` before launch and treat rotating it as invalidating outstanding links.
42. **[DONE]** ~~`/api/instructors/[id]/ai-chat`~~ — has `aiPreflight` (rate limit + feature flag), `sanitizeChat`, input validation, 404/403 checks. **Minor gap:** doesn't check the instructor's own `approvalStatus`, so a PENDING/REJECTED instructor's AI twin still answers
43. **[OPEN]** `/api/instructors/[id]/ai-persona`: POST requires self-or-admin, but the body (`action`/`sampleChat`/`apply`) is destructured raw with no zod validation, no length cap on `sampleChat`, and no rate limiting at all. **GET also leaks `aiSystemPrompt` to any caller regardless of auth** — only `canEdit` is gated, not the field itself
44. **[OPEN]** Booking ownership by unverified email → add email verification or match on `userId` only — still `OR: [{ userId }, { clientEmail }]` with no verification layer
45. **[DONE]** ~~Double-booking race~~ — create and both reschedule paths now re-check the slot inside a `$transaction` via `assertSlotStillFree()` and return 409 `SlotTakenError`
46. **[OPEN]** Add a range-exclusion constraint as a second line of defence (needs Postgres; SQLite can't express it) — still SQLite, no migration started
47. **[OPEN]** Move off per-instance SQLite `/tmp` on Vercel to a hosted DB — `prisma/schema.prisma` datasource is still `sqlite`, `prisma/dev.db` still committed
48. **[OPEN]** Strip private fields from public responses — `passwordHash` is genuinely handled (explicit omission + "Never return passwordHash!" comments). **Still leaking:** `rejectionReason`, `approvalNudgesCount`, `lastNudgedAt` unconditionally returned to all callers in `/api/instructors` (only `email` is admin-gated); `aiSystemPrompt` returned to **any caller including unauthenticated** from `/api/instructors/[id]/ai-persona` GET
49. **[OPEN]** Password reset: **token is stored in plaintext** (`crypto.randomBytes` written directly to `user.resetToken`, no hashing), **never emailed in production** (`demoResetToken` only returned when `NODE_ENV !== "production"` — there is no `sendEmail` call in this route at all, so prod users currently have no way to get a reset link), and successful reset never invalidates other sessions
50. **[OPEN]** Rate limiter: DB-backed (`RateLimitRecord`) with in-memory fallback now exists — a real improvement. Still: not atomic (read-then-write race between `findUnique`/`upsert`), `getClientIp()` trusts the first `x-forwarded-for` entry with no platform-specific trusted header, and the login limiter is keyed by email only (not email+IP) and counts every attempt, not just failures
51. **[DONE]** ~~Rejected/pending instructors keep edit rights~~ — `getClassAccess()` now revokes `canManage` unless the instructor's own `approvalStatus` is `APPROVED` (admins exempt)
52. **[OPEN]** Re-review approved classes/lessons on material edits — editing an **APPROVED** class/lesson leaves it APPROVED with no re-review trigger; only edits from REJECTED reset to PENDING (same gap as "Revision workflow" below)
53. **[DONE]** ~~Meeting links~~ — `meetingLinkSchema` in `features/booking/schemas/booking.ts` now rejects non-`http(s)` URLs
54. **[OPEN]** Same validation for lesson video URLs and profile-section links — profile-section links are done (`safeUrl` blocks `javascript:`/`data:`); lesson video URLs (`schemas/lesson.ts`'s `optionalUrl`) still only use bare `z.string().url()` with no scheme refine, so a `javascript:` URL passes
55. **[OPEN]** Anonymous booking spam: verification/CAPTCHA, cap pending bookings, expire stale PENDING — only an IP rate limit (5/10min) on create exists today; no CAPTCHA, no per-email pending cap, no stale-PENDING expiry job
56. **[OPEN]** Remove `prisma/dev.db` from git — still tracked; a stray `prisma/dev.db.backup-*` also sits in the working tree and should be gitignored
57. **[OPEN]** Zod schemas for instructor/service/blog writes; return 400 (not 500) on malformed JSON — only courses/lessons/booking have `schemas/`; instructor PATCH and blog writes still parse raw JSON
58. **[OPEN]** Gate lesson/AI-lesson endpoints on class + lesson approval; concierge shouldn't list unapproved classes — lesson-level approval filtering is done (`lesson-detail.ts`); no "concierge" discovery route was found in the codebase at all, so this half of the item may be describing a feature that doesn't exist yet — confirm scope before treating as a gap

## 📚 Classes (feature folder: `src/features/courses`) — roadmap

Each item is scoped to stay inside `src/features/courses/`, so it ships as part of
the reusable feature rather than as app-specific glue. Where an item needs
something the host application owns (payments, storage, video), it is expressed
as a **port**: the feature defines the interface, the app provides the adapter —
the pattern already used by `setPaidEntitlementResolver`.

### Learning experience
59. **[OPEN]** **Resume where you left off** — `Enrollment` has no `lastViewedLessonId`/timestamp field yet; no "Continue" CTA on `ClassCard` or the class page
60. **[OPEN]** **Progress model** — `LessonProgress` is still binary per-lesson `completedAt` inside this feature. Note: the platform now has a *much* richer progress system living outside this feature — `Skill`/`UserSkill`/`SkillPrerequisite` models, `SkillGraph.tsx`, and `getLearnerSnapshot()` powering the user dashboard — so don't double-count this as fully missing platform-wide; the ask here is specifically per-class % + streaks + an `onProgress` port inside `courses` itself
61. **[OPEN]** **Quizzes as a first-class type** — `lesson-quiz.ts` still generates an ephemeral AI quiz on every call (not persisted, no pass marks, no retakes, no `schemas/quiz.ts`). Separately, the platform now has a full authored question-bank system (`PracticeQuestion`/`PracticeAttempt`, `/practice`, `PracticeRunner.tsx`) — worth deciding whether this item stays scoped to `courses` or just redirects learners to `/practice` instead
62. **[OPEN]** **Certificates** — issue on completion (configurable threshold); render as a shareable page plus PDF, signed so it can be verified — no `Certificate` model exists anywhere
63. **[OPEN]** **Notes & bookmarks** — a generic `Bookmark` model exists (kind/refId/label/href) but it's a saved-item shortcut, not per-lesson private notes or timestamped video bookmarks; no Markdown export
64. **[OPEN]** **Transcripts & search** — store lesson transcripts; full-text search across a class, deep-linking to the timestamp — `Lesson` has no transcript field
65. **[OPEN]** **Downloadable materials** — attachments per lesson behind the same access check as `content`, via a `FileStorage` port (S3/R2/local) — no attachments field, no port defined
66. **[DONE]** ~~Focus management in `PasswordUnlockModal`~~ — now inherited for free from the shared `Modal` (focus trap + restore)
67. **[OPEN]** **Accessibility pass (remaining)** — captions on lesson video, keyboard-navigable lesson list

### Monetisation & access
_Re-audited 2026-10-08: every unchecked item below is confirmed still not implemented — no Stripe keys set_
_(so `/checkout` 503s), no refund/revocation handling, no cohorts/coupons/seat-limits/gifting of any kind._
68. **[DONE]** ~~**Payments**~~ — Stripe Checkout (`POST /api/classes/[id]/checkout`) + signed webhook (`POST /api/webhooks/stripe`) writing an `Entitlement` row; `ClassCard` shows "Enroll · $49" and redirects. Only the webhook grants access; replays are idempotent via `providerRef`.
69. **[OPEN]** Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` — until then `/checkout` returns 503 and paid classes stay closed
70. **[OPEN]** End-to-end test with `stripe listen --forward-to localhost:3006/api/webhooks/stripe` and a test card
71. **[OPEN]** Receipts, tax/VAT, and refund handling (`charge.refunded` -> revoke the entitlement)
72. **[OPEN]** Admin "grant access" action writing `Entitlement{ source: "admin_grant" }`
73. **[OPEN]** **Cohorts & drip scheduling** — release lessons on a schedule relative to enrolment or to a fixed cohort start date
74. **[OPEN]** **Coupons, trials and bundles** — percentage/fixed discounts, time-limited free access, multi-class bundles
75. **[OPEN]** **Refunds and revocation** — revoking an entitlement must immediately close `canViewContent`
76. **[OPEN]** **Seat limits and waitlists** — cap enrolment per class; waitlist with automatic promotion
77. **[OPEN]** **Gifting / team seats** — one payer, many seats, with an invite flow

### Instructor tooling
78. **[OPEN]** **Bulk lesson authoring** — paste an outline, get draft lessons; CSV/Markdown import — not found
79. **[OPEN]** **AI lesson drafts** — `/api/ai/lesson-draft` exists *and is already surfaced* in `LessonManager` (`draftWithAi()`). Still missing: it's an all-or-nothing replace behind a `confirm()` dialog, not accept/revise/discard per section
80. **[OPEN]** **Class templates & duplication** — clone a class with its lesson structure; save a class as a reusable template — no duplicate/clone functionality found
81. **[OPEN]** **Scheduled publishing** — publish at a future time; `isPublished` is still a plain `Boolean @default(true)`, no `publishAt` field
82. **[OPEN]** **Analytics** — enrolment over time, completion rate, per-lesson drop-off, quiz score distribution; expose as a feature-owned endpoint so the dashboard stays thin — no analytics endpoint exists under this feature
83. **[OPEN]** **Revision workflow** — editing an approved class should re-queue it for review (see the open item in Security) — confirmed still missing, same code path
84. **[OPEN]** **Drag-and-drop lesson reordering** — the reorder endpoint exists; `LessonManager` still uses up/down buttons (`move(index, delta)`)
85. **[OPEN]** **Preview as student** — render the class exactly as an unenrolled or enrolled learner would see it — not found

### Social & engagement
_Re-audited 2026-10-08: every item below is confirmed still greenfield — no `Discussion`, `Announcement`,_
_`Leaderboard`, Q&A, or review/rating model or route exists anywhere in the schema or codebase._
86. **[OPEN]** **Per-lesson discussions** — threaded comments scoped to a lesson, visible only to people with content access
87. **[OPEN]** **Q&A with instructor answers** — upvoting, "answered" state, and a digest to the instructor
88. **[OPEN]** **Reviews & ratings** — only from enrolled learners past a completion threshold; aggregate onto `ClassCard`
89. **[OPEN]** **Announcements** — instructor broadcasts to a class, delivered through the existing `@/lib/notify` channels
90. **[OPEN]** **Cohort chat / study groups** — opt-in, per-cohort, with the same access gate as content
91. **[OPEN]** **Completion leaderboards & badges** — opt-in, privacy-respecting, off by default
92. **[OPEN]** **Shareable progress** — "I completed X" card with an OG image, linking back to the public class page

## 🐞 Bugs

### Tailwind dropped every class unique to `src/features` (fixed 2026-10-05)
Moving components into `src/features/**` left them outside `tailwind.config.ts`'s
`content` globs, so Tailwind never saw those files and omitted any utility used
*only* there — `p-7` among them, which is why class cards rendered with no padding.
Nine classes were being dropped (~2 KB of CSS). Typecheck, `next build` and HTTP
status checks all pass with the CSS missing, so nothing caught it automatically.

93. **[DONE]** ~~Add `./src/features/**/*.{js,ts,jsx,tsx,mdx}` to the Tailwind `content` globs~~
94. **[OPEN]** Any future top-level source directory must be added to those globs too — worth a comment or a lint check
95. **[OPEN]** Note: editing `tailwind.config.ts` does **not** hot-reload; the dev server must be restarted


### Dev server: `ChunkLoadError` / 500s from a wiped `.next` (diagnosed 2026-10-05)

**Cause:** the Antigravity IDE agent starts the dev server for you — sometimes via
`./startup.sh`, sometimes by running `next dev` directly. Neither had a port guard or an
isolated build directory, so an invocation could start *another* `next dev` compiling into
the same `.next` as whichever server was already running, and the two then clobbered each
other's chunks and manifests.

Because the IDE sometimes bypasses `startup.sh`, hardening that script only covers one of
the two paths — a server started directly still uses the default `.next`. Two servers are
only safe when they differ in **both** port and build directory.

**Why it breaks so badly:** `next dev` writes `routes-manifest.json` and
`prerender-manifest.json` **once**, at startup
([`setup-dev-bundler.js`](node_modules/next/dist/server/lib/router-utils/setup-dev-bundler.js)),
and never rewrites them — while every route module load reads `routes-manifest.json`
from disk. Once the directory is disturbed, pages keep rendering (webpack re-emits their
chunks on demand) but **every API route 500s** and chunk URLs go stale, until restart.

Symptoms seen while reproducing it: `ChunkLoadError` on `app/classes/page`, API routes
500ing on a missing `routes-manifest.json`, `Could not find the module ... in the React
Client Manifest`, `__webpack_modules__[moduleId] is not a function`, and webpack's own
cache rename failing with ENOENT.

**Fix:** give the dev server its own build directory — `next.config.ts` already supports
it and `.gitignore` already covers `.next-*/`:

```sh
NEXT_DIST_DIR=.next-dev npm run dev -- -p 3006
```

96. **[DONE]** ~~`startup.sh` frees the port first and exports `NEXT_DIST_DIR=.next-dev`~~ — covers the path where the IDE runs that script
97. **[OPEN]** **Still open:** a server the IDE launches directly (`next dev`, port 3000, default `.next`) has no such guard. Put the check in `npm run dev` itself so it holds however the server is started
98. **[OPEN]** Never run `next build` against the same build directory a dev server is using (`next build` cleans it)
99. **[OPEN]** Consider having `npm run dev` itself refuse to start when the port is already held, so the guard doesn't depend on `startup.sh`

100. **[OPEN]** "Add/Edit Profile Sections" links: scroll to `#profile-sections` after `profile` loads (section only renders when `profile` is set); show button only when available — still a plain `<a href="#profile-sections">` on both the instructor dashboard and `/profile`, no scroll-into-view effect, no conditional
101. **[OPEN]** Add try/catch/finally + error/retry UI: instructor dashboard, AdminBookings, AdminClients, AdminAvailability, LessonManager, book page — *courses catalog page done via `useClasses`*. Re-audited: instructor dashboard, AdminBookings, LessonManager and book page all have try/catch now; **`AdminClients.tsx` and `AdminAvailability.tsx` still have none** around their fetches. None of the six has an actual "Retry" button yet (errors render as text only)
102. **[OPEN]** AbortController / request-id guards for stale responses (admin search, instructor filters, instructor profile, lesson nav, SlotPicker) — *courses catalog done via `useClasses`*. Re-audited: `useEvents`/`useEventRequests`/`useAi` hooks now also have `AbortController`; `AdminClients`, instructor filters/profile, and `SlotPicker` still don't
103. **[OPEN]** MentorBookingModal (was PractitionerBookingModal): don't overwrite typed fields on session refetch; reset state per mentor; pass `serviceId` instead of using first service — confirmed still unfixed (this file wasn't touched by this session's Modal/Avatar refactor beyond the shell swap)
104. **[DONE]** ~~Shared accessible `Modal`~~ — built (`src/components/ui/Modal.tsx`: role=dialog, Escape, focus trap/restore, scroll lock, inert siblings) and adopted by booking (`MentorBookingModal`), AI chat (`InstructorAiChatModal`), and password unlock (`PasswordUnlockModal`) this session. **Not yet applied to:** the profile `TemplatePicker` (`ProfileSectionsEditor.tsx`), `MobileMenu`, or the admin `Drawer` (`admin/shared.tsx`) — each still has its own bespoke overlay
105. **[DONE]** Close AccountMenu on navigation — added a `usePathname` effect that closes the popover on any route change, alongside the existing outside-click/Escape handling
106. **[OPEN]** Dashboard hub: handle authenticated session with no role; use `router.replace` — `router.replace` is already used everywhere in `dashboard/page.tsx`, but the "authenticated with no role" case still falls through both branches, leaving the user stuck on the spinner with no fallback
107. **[OPEN]** InstructorAiChatModal: persist saved persona to parent, abort in-flight requests, clean up timers — even after this session's Modal refactor (which fixed scroll-lock/focus/Escape generically), `handleSaveSettings` still doesn't call back to update the parent's `instructor` object, there's no `AbortController` anywhere in the file, and the two `setTimeout` calls (input focus, post-save notice) still have no cleanup
108. **[DONE]** Booking confirmation: don't show "not found" on transient refetch error — split into a separate `loadError` state; only an actual 404 response sets `notFound`, everything else (other HTTP errors, thrown fetch exceptions) now shows a "Could not load your booking" card with a working retry button
109. **[DONE]** ~~Notification logs: record real delivery result instead of hardcoded "SENT"~~ — `src/lib/notify/channels.ts` genuinely calls nodemailer/Twilio and returns `SENT`/`FAILED`/`SKIPPED` with the real result logged to `NotificationLog`; cron reminders only count a send as successful when at least one channel actually reports `SENT`
110. **[OPEN]** Format notification times in the booking timezone (not server locale) — the main client-facing notice path does pass the booking/practice timezone through; **two instructor-facing notify call sites** (`bookings.ts`, `booking-detail.ts`) still call `.toLocaleString()` with no `timeZone` option
111. **[OPEN]** Fix 9 `useEffect`/`useCallback` missing-dep lint warnings (blog `[slug]`, blog list, course edit, course detail, `AdminMentors`, `InstructorAiChatModal`, `MentorBookingModal` ×2, `SlotPicker`) — re-ran lint 2026-10-08: same 8 files as before (renamed: AdminPractitioners→`AdminMentors`, PractitionerBookingModal→`MentorBookingModal`), still open
112. **[OPEN]** Booking wizard service cards: make keyboard-accessible (`button`/radio) and add error/empty state — `book/page.tsx` service cards are still plain `onClick` divs with no `role`/`tabIndex`/`onKeyDown`, and no explicit empty-state branch for zero services

## 🎨 UI / Look & Feel
113. **[DONE]** ~~Replace raw `<img>` with `next/image` (7 files) + initials fallback; show avatar in ClassCard~~ — done this session: `Avatar` component, 8 call sites across 7 files, confirmed zero `<img>` tags remain
114. **[DONE]** Design tokens: status (success/warn/danger/info) — added `--success-rgb-ch`/`--warning-rgb-ch`/`--danger-rgb-ch` to `tokens.css` plus `success`/`warning`/`danger`/`info` Tailwind color keys, and fixed `StatusBadge` (`admin/shared.tsx`), which had been reusing identical "cream" styling for both `PENDING` and `CANCELLED` — they're now warning/danger respectively, `CONFIRMED`/`RESCHEDULED` use `success`. **Not done:** an "overlay surface" token, and the gold-light/dark ramp was already in place before this (`--orange`/`--orange-bright`/etc.). Hardcoded hex still appears repeatedly in `instructors/[id]/page.tsx` (17), `instructors/page.tsx` (8), `AdminBookings.tsx` (5), `AdminMentors.tsx` (7), `AdminClassesReview.tsx` (3), `ClassCard.tsx` (2) — untouched
115. **[OPEN]** Shared primitives: `Input/Select/Textarea`, `Toggle`, `Card`, `Alert`, `Badge`, `StatCard`; add `loading` prop to `Button`; use `Button` in ClassCard — none of these exist yet (only `Skeleton`, built this session, is done from this list); `Button` has no `loading` prop
116. **[DONE]** ~~Add `loading.tsx` / `error.tsx` for classes, instructors, my-bookings, book, dashboard, profile; visible `role="alert"` errors~~ — done this session for all six routes, built on shared `RouteFallback.tsx`
117. **[DONE]** ~~Keyboard focus rings on inputs/toggles~~ — a global `:focus-visible` rule already covers button/a/input/select/textarea (`base.css`)
118. **[DONE]** Make instructor cards real links — replaced the `<div role="button" tabIndex={0} onClick=...>` with a "stretched link" pattern (an absolutely-positioned `<Link>` behind the card's other content, `z-10` on the nested interactive bits — AI Twin buttons, course links, Book 1:1 — so they stay independently clickable): the card is now a real `<a>` supporting middle-click/cmd-click/open-in-new-tab, without invalidly nesting a `<button>` inside it
119. **[OPEN]** Performance: static/tiled grain overlay, drop blur-reveal on mobile, reduce `backdrop-blur`, cap WebGL pixel ratio/particles on mobile — `.grain-overlay` still animates unconditionally (only disabled under reduced-motion, not made static/tiled or mobile-gated); `StarfieldBackground` caps devicePixelRatio at 2 globally and scales particle count by viewport area (a reasonable proxy, not an explicit mobile cap); `backdrop-blur` still appears ~69 times with no evidence of reduction
120. **[DONE]** ~~Reduced-motion safety net + hide cursor glow~~ — `reduced-motion.css` now also disables the new `.skeleton-sweep`; `useCursorGlow` already checks both fine-pointer and reduced-motion; hover-stuck states on touch are handled via `@media (hover: none)` in `cards.css` (equivalent intent to "wrap in `@media (hover:hover)`")
121. **[OPEN]** Scope global 44px min-height to buttons/tap targets only; min text size 11–12px; fix placeholder/input-border contrast — `min-height: 44px` still applies to **every** `button, a, input, select, textarea` globally (not scoped; low real-world impact since plain inline `<a>` text isn't affected by `min-height`, but worth scoping properly); `text-[9px]`/`text-[10px]` utilities still appear ~83 times. **Now done, split out of this item:** root font-size is `106.25%` (was a fixed `17px`) so it actually scales with the visitor's own browser font-size preference while keeping the same visual size by default, and `color-scheme: dark` / `color-scheme: light` are set on `html`/`html.light` so native controls (date pickers, scrollbars) match the theme
122. **[OPEN]** Use `100dvh`, allow CTA wrapping at 320px, `text-base` inputs on mobile (avoid iOS zoom) — no `dvh` usage found anywhere; `Button.tsx` hardcodes `whitespace-nowrap` on every button (actively prevents the wrapping this item asks for); inputs on `book`, `profile`, and `MentorBookingModal` still use `text-sm` (will trigger iOS auto-zoom on focus)
123. **[OPEN]** Split 1255-line `instructors/[id]/page.tsx` into section components — shrank some from other refactors but still one monolithic file

## ✨ UI Enrichments
124. **[DONE]** ~~Skeleton loaders shaped like the real cards (classes, instructors, bookings, dashboards) instead of "Loading…" text~~ — `Skeleton`/`SkeletonCard`/`SkeletonAvatarCard`/`SkeletonStat`/`SkeletonGrid` built this session and wired into `/instructors`, `/courses`, and all six route-level `loading.tsx` files
125. **[OPEN]** Richer empty states: icon/illustration, helper text and a CTA (e.g. "Browse practitioners", "Clear filters") — `EmptyState` gained an `icon` slot this session and `/labs`, `/projects`, `/paths`, `/bootcamp` now use it; `/instructors` ("No mentors in this category") and `/courses` ("No classes match this search" + reset CTA) already had their own icon+CTA treatment. Other catalogue/dashboard empty states not yet audited individually — likely inconsistent rather than universal
126. **[DONE]** ~~Toast system (success/error/info) to replace `alert()` in the instructor and admin dashboards~~ — `Toast`/`ToastProvider`/`useToast()` built this session, wired into `Providers.tsx`; every bare `alert()` in the app replaced (confirmed via full-repo grep). **Not addressed:** `window.prompt()` (2 call sites in the instructor dashboard, for meeting-link/decline-reason text entry) still needs real text input, which a toast can't provide — that's a separate, smaller follow-up (a small input modal)
127. **[OPEN]** Instructor cards: rating/review count, next-available-slot chip, modality tags, and a clear "Book" CTA — no `Review`/`Rating` model exists; the "4.99 / 5" and "17+ Years" stats on the instructor profile are hardcoded placeholder text, not computed. Specialty pills already exist (partial "modality tags"), and a "Book 1:1" CTA already exists — the rating system and slot chip are the real gaps
128. **[OPEN]** Instructor profile: section jump-nav with scroll-spy, and a real gallery/lightbox — **sticky booking bar on mobile already exists** (`showStickyBar` in `instructors/[id]/page.tsx`, confirmed this session while migrating its avatar) and should be considered done; no jump-nav/scroll-spy or lightbox found
129. **[DONE]** ~~Booking flow: stepper with progress, summary sidebar, calendar-style date picker with timezone label, and "Add to calendar" (.ics) on confirmation~~ — confirmed all four already exist: a numbered 3-step indicator, a persistent order-summary sidebar, `SlotPicker`'s date grid + timezone selector, and a real downloadable `.ics` file on the confirmation page
130. **[OPEN]** AI chat: copy/regenerate message actions, safe-area/`100dvh` sizing on mobile — typing indicator and suggested-question chips already exist (confirmed, not listed as open); copy/regenerate not found; modal still uses `max-h-[90vh]`/fixed px heights, no `dvh` or safe-area insets
131. **[OPEN]** Search, filters and sort on instructors and classes (modality, price, availability), with active-filter chips and URL-synced state — `/courses` search is local-state only (not URL-synced); `/instructors` type tabs hit the API but don't reflect in the URL; no price/availability filters, no sort, no active-filter-chip UI anywhere
132. **[OPEN]** Dashboard: stat cards with trend indicators, status badges for bookings (pending/confirmed/cancelled), and mobile-friendly tables — `StatusBadge` already covers the status-badge half; no trend-indicator UI found anywhere; only `AdminClients` wraps its table in `overflow-x-auto` today
133. **[OPEN]** Form UX: inline validation, character counters, password strength meter, and autosave drafts for profile sections — none found; forms still validate on submit only
134. **[OPEN]** Profile sections editor: drag-and-drop reordering with live preview — still `moveUp`/`moveDown` buttons
135. **[OPEN]** Image upload for avatars and galleries with crop and preview — no upload endpoint exists at all yet
136. **[DONE]** ~~Page transitions and micro-interactions (button press, card hover lift, animated tab underline) that respect reduced motion~~ — `template.tsx` does a framer-motion fade/slide on route change; `cards.css` hover-lift and `effects.css` nav underline already existed; reduced-motion respected throughout
137. **[DONE]** ~~Light/dark or "daylight" theme toggle~~ — `ThemeToggle.tsx` is fully built (sun/moon icon, localStorage persistence, `prefers-color-scheme` default) and wired into `EditorialHeader`; `tokens.css` defines the full light-mode palette it switches to. *(The broader status-color token cleanup it was waiting on is still only partially done — see UI / Look & Feel above.)*
138. **[OPEN]** Testimonials/social proof carousel on instructor pages and the home page — a static (non-carousel) testimonials section-type exists in the profile-sections system; nothing on the home page specifically, and nothing is a carousel
139. **[DONE]** ~~Zodiac-themed accents: sign-based gradient on user profile and horoscope teaser card on the user dashboard~~ — **closed as not applicable**, not built. Confirmed via a repo-wide grep for `zodiac|horoscope|astrology`: zero matches outside this file. Nothing should be built for this post-migration
140. **[OPEN]** Global command/search palette (Cmd+K) for classes, practitioners and pages — no `cmdk` or command-palette code found anywhere
141. **[OPEN]** Breadcrumbs and a "back" affordance on deep pages (lessons, class edit, instructor profile) — the instructor profile has a single "← All Instructors" back link, which is not a real multi-level breadcrumb trail; other deep pages not confirmed to have even that much
142. **[OPEN]** Consistent notification bell with unread count for booking and approval updates — no such component exists; the only `Bell` icon usages found are a "Notify Admin" nudge button and a nudge-count badge, neither is a real notification inbox


# AI Bootcamp — Master Feature Checklist (aspirational roadmap)

> **Reframed 2026-10-08.** This was pasted in as a generic "Certification Learning Platform" spec; it is
> kept (not deleted) because it's a legitimate long-term direction for this app — note its own worked
> examples ("Hooks vs tools", "CLAUDE.md vs rules", "Context window vs memory") are already AI-engineering
> concepts, not astrology. But **there is no "Certification" concept in this codebase today** — the product
> is built around `LearningPath` → `Course` → `Module` → `Lesson`, plus a `Skill` graph, `PracticeQuestion`/
> `PracticeAttempt`, `Lab`/`LabRun`, `Project`, `Bootcamp`/`BootcampWeek`, and an AI tutor (`TutorThread`).
> Treat every section below as **unimplemented until it has a checked box or a status line saying
> otherwise** — the individual bullets under each numbered section were not re-audited one by one (that
> would be ~400 individual checks); what follows is a section-level status pass against the real schema,
> routes and components, done 2026-10-08.
>
> **Section-by-section status:**
> 1. Auth & Account — **mostly done** (credentials login/register/forgot/reset exist; no Google OAuth)
> 2. Homepage — not verified against this checklist's specific asks (generic marketing hero exists)
> 3. Certification System — **not started** (no `Certification` model/route — superseded by `LearningPath`/`Bootcamp`)
> 4. Certification Navigation — **not started** (same reason — no per-cert tab set exists)
> 5. Study Guide System — **stub** (no `StudyGuide` model; `Lesson` has some overlapping fields)
> 6. Concept Library — **stub** (no `Concept` model; `Skill` covers taxonomy loosely)
> 7. "Frequently Confused" Concepts — **not started**
> 8. Question Bank — **partial** (`PracticeQuestion` is real and rich, but no domain/objective mapping or true-false/matching/sorting types)
> 9. Question Metadata — **partial** (most fields map; missing certification/domain/objective/per-distractor/tags/source)
> 10. Practice Engine — **mostly done** (`PracticeRunner.tsx` + `/api/practice`; missing timed mode, retry-incorrect-only)
> 11. Answer Explanation System — **partial** (single explanation shown; no per-option "why X is wrong")
> 12. Confidence Tracking — **partial** (1–5 confidence genuinely captured on `PracticeAttempt`; no aggregated "confident+wrong" analytics surfaced)
> 13. Domain Practice — **stub** (`Skill`/weak-area mode substitutes loosely for "domain")
> 14. Adaptive Practice — **partial** (`mode=weak` picks lowest-mastery skills; no recency/confidence-error weighting)
> 15. Daily Question — **not started**
> 16. Mock Exams — **not started** — the single biggest true gap (no model, route, or UI at all)
> 17. Readiness Assessment — **not started** — no domain-weighted confidence self-rating anywhere
> 18. Enterprise Case Studies — **not started** (`PracticeKind.CASE_STUDY` is just an enum tag, no `CaseStudy` model)
> 19. Search — **not started** — no global search or command palette anywhere
> 20. Dashboard — **partial** (`/progress` shows streak, mastery, accuracy, weak areas, recommended next action)
> 21. Progress Analytics — **partial** (accuracy/streak tracked; no time-series or confidence-vs-accuracy views)
> 22. Study Plan — **not started**
> 23. References/Cheat Sheets — **not started**
> 24. AI Features — **partial** (real AI tutor chat + lesson-draft generation exist; no ELI5/architect toggle, no voice)
> 25. Gamification — **stub** (`streakDays` shown; `xp` field exists on `User` but is **never rendered** anywhere; no badges)
> 26. Admin/CMS — **partial, misdirected** (admin UI covers bookings/instructors/course-approval/events; **zero** admin UI for `PracticeQuestion`/`Lab`/`Project`/`LearningPath`/`Bootcamp` — presumably seeded by script only)
> 27. Question Quality System — **not started** (only a generic `DRAFT/REVIEW/PUBLISHED/ARCHIVED` status, no reviewer workflow)
> 28. Trust & Integrity — **partial** (server-side grading is real; no randomization, no anti-cheating)
> 29. Feedback & Support — **stub** (contact page exists; no structured feedback/report-issue model)
> 30. UI/UX — **mostly done** (the premium card/glow/shimmer design system this session built on top of)
> 31. Navigation — **partial** (no breadcrumbs, no command palette, no certification selector — none needed without a Certification model)
> 32. Technical/Performance — **partial** (Next.js 15 App Router, `RateLimitRecord`-backed rate limiting, cron route exist; caching/image-opt/error-monitoring not individually verified)
> 33. SEO — **partial** (per-page metadata exists; no sitemap/robots check performed)
> 34. Core Product Loop — **partial** — **Learn → Practice → Explain → Track result/confidence → Identify weakness → Recommend next is implemented end-to-end** (`Lesson` → `PracticeQuestion` → `PracticeAttempt` → `UserSkill` → `getLearnerSnapshot` recommendation); the loop breaks at "Take mock" / "Update readiness" / "Certification" — those stages don't exist yet
>
> **Highest-leverage real gaps (zero scaffolding, build-from-scratch), in priority order:** Mock Exams,
> Readiness Assessment, a Certification concept itself (or a deliberate decision to keep organizing around
> `LearningPath`/`Bootcamp` instead), Search (+ command palette), Gamification UI (xp/badges — the data
> already exists, just never rendered), Case Studies as a real linked-scenario model, Study Plan automation,
> and an admin CMS for the learning-content models.

## 1. Authentication & Account

143. **[OPEN]** Email/password registration
144. **[OPEN]** Email/password login
145. **[OPEN]** Google OAuth login
146. **[OPEN]** Logout
147. **[OPEN]** Forgot password
148. **[OPEN]** Reset password
149. **[OPEN]** User profile
150. **[OPEN]** Persistent login/session
151. **[OPEN]** Account settings
152. **[OPEN]** User-specific progress storage
153. **[OPEN]** User-specific attempt history

---

## 2. Homepage / Landing Page

154. **[OPEN]** Premium hero section
155. **[OPEN]** Clear product positioning
156. **[OPEN]** Primary CTA — Start Learning
157. **[OPEN]** Primary CTA — Practice
158. **[OPEN]** CTA — Take Mock Exam
159. **[OPEN]** Certification overview
160. **[OPEN]** Certification cards
161. **[OPEN]** Domain/skill overview
162. **[OPEN]** Learning methodology section
163. **[OPEN]** Practice methodology section
164. **[OPEN]** Adaptive learning explanation
165. **[OPEN]** Scenario-based learning explanation
166. **[OPEN]** Trust / credibility section
167. **[OPEN]** FAQ
168. **[OPEN]** Footer navigation
169. **[OPEN]** Login/Register CTA
170. **[OPEN]** Responsive mobile layout

---

# 3. Certification System

171. **[OPEN]** Certification listing page
172. **[OPEN]** Individual certification landing page
173. **[OPEN]** Certification overview
174. **[OPEN]** Exam objectives
175. **[OPEN]** Exam domains
176. **[OPEN]** Domain weight percentages
177. **[OPEN]** Exam question count
178. **[OPEN]** Exam duration
179. **[OPEN]** Passing score
180. **[OPEN]** Exam cost
181. **[OPEN]** Exam delivery information
182. **[OPEN]** Eligibility information
183. **[OPEN]** Official exam resources
184. **[OPEN]** Certification-specific study plan

---

# 4. Certification Navigation

Each certification should have:

185. **[OPEN]** Overview
186. **[OPEN]** Exam Guide
187. **[OPEN]** Study Guides
188. **[OPEN]** Concepts
189. **[OPEN]** Practice
190. **[OPEN]** Domain Practice
191. **[OPEN]** Adaptive Practice
192. **[OPEN]** Readiness Check
193. **[OPEN]** Mock Exams
194. **[OPEN]** Case Studies
195. **[OPEN]** References / Cheat Sheets
196. **[OPEN]** FAQ

---

# 5. Study Guide System

197. **[OPEN]** Study guide library
198. **[OPEN]** Guides grouped by domain
199. **[OPEN]** Individual guide pages
200. **[OPEN]** Estimated reading time
201. **[OPEN]** Breadcrumb navigation
202. **[OPEN]** Table of contents
203. **[OPEN]** Previous/next guide navigation
204. **[OPEN]** Related guides
205. **[OPEN]** Related concepts
206. **[OPEN]** Key takeaways
207. **[OPEN]** Practical examples
208. **[OPEN]** Architecture examples
209. **[OPEN]** Code examples
210. **[OPEN]** Decision rules
211. **[OPEN]** Common mistakes
212. **[OPEN]** Exam tips
213. **[OPEN]** FAQ per guide
214. **[OPEN]** "Practice this topic" CTA
215. **[OPEN]** Bookmark/save guide

---

# 6. Concept Library

216. **[OPEN]** Global concept library
217. **[OPEN]** Concept cards
218. **[OPEN]** Concept search
219. **[OPEN]** Concept filtering
220. **[OPEN]** Concept categories
221. **[OPEN]** Definition
222. **[OPEN]** Why it matters
223. **[OPEN]** When to use
224. **[OPEN]** When not to use
225. **[OPEN]** Practical example
226. **[OPEN]** Exam relevance
227. **[OPEN]** Common trap
228. **[OPEN]** Related concepts
229. **[OPEN]** Similar concepts
230. **[OPEN]** Detailed explanation
231. **[OPEN]** Practice questions for concept
232. **[OPEN]** Copy concept as Markdown

---

# 7. "Frequently Confused" Concepts

233. **[OPEN]** Confused-concept library
234. **[OPEN]** A vs B comparisons
235. **[OPEN]** Difference table
236. **[OPEN]** When to use A
237. **[OPEN]** When to use B
238. **[OPEN]** Common exam trap
239. **[OPEN]** Example scenario
240. **[OPEN]** Quick decision rule
241. **[OPEN]** Practice question

Examples:

242. **[OPEN]** Tools vs structured output
243. **[OPEN]** Hooks vs tools
244. **[OPEN]** CLAUDE.md vs rules
245. **[OPEN]** Resume vs compact vs new session
246. **[OPEN]** Context window vs memory
247. **[OPEN]** Chaining vs dynamic decomposition

---

# 8. Question Bank

248. **[OPEN]** Central question database
249. **[OPEN]** Question categories
250. **[OPEN]** Certification mapping
251. **[OPEN]** Domain mapping
252. **[OPEN]** Objective mapping
253. **[OPEN]** Difficulty level
254. **[OPEN]** Question type
255. **[OPEN]** Scenario-based questions
256. **[OPEN]** Single-choice questions
257. **[OPEN]** Multiple-choice questions
258. **[OPEN]** True/false
259. **[OPEN]** Matching
260. **[OPEN]** Sorting
261. **[OPEN]** Ordering
262. **[OPEN]** Scenario branching

---

# 9. Question Metadata

Every question should support:

263. **[OPEN]** Question ID
264. **[OPEN]** Certification
265. **[OPEN]** Domain
266. **[OPEN]** Objective
267. **[OPEN]** Difficulty
268. **[OPEN]** Question type
269. **[OPEN]** Scenario
270. **[OPEN]** Options
271. **[OPEN]** Correct answer
272. **[OPEN]** Correct-answer explanation
273. **[OPEN]** Individual distractor explanations
274. **[OPEN]** Related concept
275. **[OPEN]** Related guide
276. **[OPEN]** Tags
277. **[OPEN]** Source/reference
278. **[OPEN]** Creation date
279. **[OPEN]** Last reviewed date

---

# 10. Practice Engine

280. **[OPEN]** Start practice
281. **[OPEN]** Select certification
282. **[OPEN]** Select domain
283. **[OPEN]** Select difficulty
284. **[OPEN]** Select question count
285. **[OPEN]** Mixed practice
286. **[OPEN]** Domain practice
287. **[OPEN]** Objective practice
288. **[OPEN]** Concept practice
289. **[OPEN]** Random practice
290. **[OPEN]** Timed practice
291. **[OPEN]** Untimed practice
292. **[OPEN]** Question navigation
293. **[OPEN]** Progress indicator
294. **[OPEN]** Submit answer
295. **[OPEN]** Explanation after answer
296. **[OPEN]** Correct/incorrect state
297. **[OPEN]** Next question
298. **[OPEN]** Retry incorrect questions

---

# 11. Answer Explanation System

After answering:

299. **[OPEN]** Correct/incorrect indicator
300. **[OPEN]** Correct answer
301. **[OPEN]** Why correct
302. **[OPEN]** Why option A is wrong
303. **[OPEN]** Why option B is wrong
304. **[OPEN]** Why option C is wrong
305. **[OPEN]** Why option D is wrong
306. **[OPEN]** Concept explanation
307. **[OPEN]** Exam trap
308. **[OPEN]** Decision rule
309. **[OPEN]** Related study guide
310. **[OPEN]** Practice this concept
311. **[OPEN]** Next question

---

# 12. Confidence Tracking

Before/after answering:

312. **[OPEN]** Low confidence
313. **[OPEN]** Medium confidence
314. **[OPEN]** High confidence

Track:

315. **[OPEN]** Confidence + correct
316. **[OPEN]** Confidence + incorrect
317. **[OPEN]** Low confidence + correct
318. **[OPEN]** Low confidence + incorrect
319. **[OPEN]** High-confidence mistakes

Specially identify:

320. **[OPEN]** **Confident + Wrong**
321. **[OPEN]** **Uncertain + Wrong**

---

# 13. Domain Practice

322. **[OPEN]** Domain listing
323. **[OPEN]** Domain description
324. **[OPEN]** Domain weight
325. **[OPEN]** Domain question count
326. **[OPEN]** Domain practice
327. **[OPEN]** Domain score
328. **[OPEN]** Domain accuracy
329. **[OPEN]** Domain history
330. **[OPEN]** Domain weaknesses
331. **[OPEN]** Domain recommendations
332. **[OPEN]** Retry domain
333. **[OPEN]** Practice weak domain

---

# 14. Adaptive Practice

334. **[OPEN]** Track historical accuracy
335. **[OPEN]** Track objective accuracy
336. **[OPEN]** Track domain accuracy
337. **[OPEN]** Track recency
338. **[OPEN]** Track difficulty
339. **[OPEN]** Track confidence
340. **[OPEN]** Identify weak objectives
341. **[OPEN]** Identify weak domains
342. **[OPEN]** Calculate weakness score
343. **[OPEN]** Recommend next questions
344. **[OPEN]** Prioritize recently missed concepts
345. **[OPEN]** Prioritize high-confidence mistakes
346. **[OPEN]** Adjust difficulty
347. **[OPEN]** Adaptive question selection
348. **[OPEN]** Personalized practice set

### Adaptive algorithm

349. **[OPEN]** Accuracy
350. **[OPEN]** Domain importance
351. **[OPEN]** Objective importance
352. **[OPEN]** Recency
353. **[OPEN]** Confidence error
354. **[OPEN]** Difficulty
355. **[OPEN]** Question history

---

# 15. Daily Question

356. **[OPEN]** Question of the day
357. **[OPEN]** Daily scenario
358. **[OPEN]** Submit answer
359. **[OPEN]** Explanation
360. **[OPEN]** Domain
361. **[OPEN]** Concept
362. **[OPEN]** Daily completion
363. **[OPEN]** Daily streak
364. **[OPEN]** Previous daily questions
365. **[OPEN]** Practice similar questions

---

# 16. Mock Exams

366. **[OPEN]** Mock exam listing
367. **[OPEN]** Multiple mock exams
368. **[OPEN]** Exam simulation mode
369. **[OPEN]** Exam timer
370. **[OPEN]** Question counter
371. **[OPEN]** Progress indicator
372. **[OPEN]** All-domain questions
373. **[OPEN]** Scenario questions
374. **[OPEN]** Single-choice questions
375. **[OPEN]** Multiple-response questions
376. **[OPEN]** Question navigation
377. **[OPEN]** Flag question
378. **[OPEN]** Review unanswered
379. **[OPEN]** Submit exam
380. **[OPEN]** Auto grading
381. **[OPEN]** Final score
382. **[OPEN]** Domain breakdown
383. **[OPEN]** Objective breakdown
384. **[OPEN]** Question review
385. **[OPEN]** Detailed explanations
386. **[OPEN]** Weak-area identification
387. **[OPEN]** Mock history

---

# 17. Readiness Assessment

388. **[OPEN]** Readiness check
389. **[OPEN]** Rate confidence per domain
390. **[OPEN]** 1–5 confidence scale
391. **[OPEN]** Domain weighting
392. **[OPEN]** Weighted readiness score
393. **[OPEN]** Strong domains
394. **[OPEN]** Weak domains
395. **[OPEN]** Priority areas
396. **[OPEN]** Recommended study topics
397. **[OPEN]** Readiness history
398. **[OPEN]** Reassessment
399. **[OPEN]** Progress comparison

---

# 18. Enterprise Case Studies

400. **[OPEN]** Case-study library
401. **[OPEN]** Healthcare scenario
402. **[OPEN]** Insurance scenario
403. **[OPEN]** FinTech scenario
404. **[OPEN]** Retail scenario
405. **[OPEN]** Government scenario
406. **[OPEN]** Manufacturing scenario
407. **[OPEN]** Shared business context
408. **[OPEN]** Architecture context
409. **[OPEN]** Multiple linked questions
410. **[OPEN]** Changing requirements
411. **[OPEN]** Changing constraints
412. **[OPEN]** Architecture decisions
413. **[OPEN]** Confidence rating
414. **[OPEN]** Case-study score
415. **[OPEN]** Detailed explanation
416. **[OPEN]** Decision analysis
417. **[OPEN]** Case-study completion tracking

---

# 19. Search

418. **[OPEN]** Global search
419. **[OPEN]** Search guides
420. **[OPEN]** Search concepts
421. **[OPEN]** Search questions
422. **[OPEN]** Search mock exams
423. **[OPEN]** Search case studies
424. **[OPEN]** Search references
425. **[OPEN]** Search certifications
426. **[OPEN]** Search suggestions
427. **[OPEN]** Search results grouping
428. **[OPEN]** Content-type filtering
429. **[OPEN]** Certification filtering
430. **[OPEN]** Domain filtering

---

# 20. Dashboard

## Personal Dashboard

431. **[OPEN]** Overall readiness
432. **[OPEN]** Current certification
433. **[OPEN]** Overall accuracy
434. **[OPEN]** Questions answered
435. **[OPEN]** Questions remaining
436. **[OPEN]** Study time
437. **[OPEN]** Current streak
438. **[OPEN]** Domain performance
439. **[OPEN]** Weak domains
440. **[OPEN]** Strong domains
441. **[OPEN]** Recent activity
442. **[OPEN]** Mock scores
443. **[OPEN]** Readiness score
444. **[OPEN]** Recommended next action

### "What should I do next?"

445. **[OPEN]** Recommended guide
446. **[OPEN]** Recommended concept
447. **[OPEN]** Recommended practice
448. **[OPEN]** Recommended mock
449. **[OPEN]** Recommended case study

---

# 21. Progress Analytics

450. **[OPEN]** Overall accuracy
451. **[OPEN]** Domain accuracy
452. **[OPEN]** Objective accuracy
453. **[OPEN]** Question difficulty performance
454. **[OPEN]** Average question time
455. **[OPEN]** Mock scores
456. **[OPEN]** Readiness score
457. **[OPEN]** Study time
458. **[OPEN]** Attempt history
459. **[OPEN]** Accuracy over time
460. **[OPEN]** Domain improvement over time
461. **[OPEN]** Weakness trend
462. **[OPEN]** Confidence vs accuracy
463. **[OPEN]** High-confidence mistakes
464. **[OPEN]** Learning streak

---

# 22. Study Plan

465. **[OPEN]** Create study plan
466. **[OPEN]** Exam date
467. **[OPEN]** Target certification
468. **[OPEN]** Daily study goal
469. **[OPEN]** Weekly study goal
470. **[OPEN]** Recommended guides
471. **[OPEN]** Recommended practice
472. **[OPEN]** Recommended mocks
473. **[OPEN]** Recommended case studies
474. **[OPEN]** Progress against plan
475. **[OPEN]** Daily tasks
476. **[OPEN]** Weekly milestones
477. **[OPEN]** Automatic plan adjustment

---

# 23. References / Cheat Sheets

478. **[OPEN]** Domain blueprint
479. **[OPEN]** Exam cheat sheet
480. **[OPEN]** Flashcards
481. **[OPEN]** Study plan
482. **[OPEN]** Decision matrices
483. **[OPEN]** Architecture patterns
484. **[OPEN]** Judgment traps
485. **[OPEN]** Quick-reference guides
486. **[OPEN]** Printable references
487. **[OPEN]** Downloadable PDF
488. **[OPEN]** Markdown export

---

# 24. AI Features — Recommended Upgrade

489. **[OPEN]** AI tutor
490. **[OPEN]** Ask about a concept
491. **[OPEN]** Explain like I'm five
492. **[OPEN]** Explain at architect level
493. **[OPEN]** Generate examples
494. **[OPEN]** Generate scenarios
495. **[OPEN]** Explain why answer is wrong
496. **[OPEN]** Compare two concepts
497. **[OPEN]** AI-generated practice
498. **[OPEN]** AI-generated revision
499. **[OPEN]** Personalized study recommendations
500. **[OPEN]** AI study-plan generation
501. **[OPEN]** Voice explanation
502. **[OPEN]** AI conversation history

---

# 25. Gamification

503. **[OPEN]** Daily streak
504. **[OPEN]** Weekly streak
505. **[OPEN]** Learning milestones
506. **[OPEN]** Badges
507. **[OPEN]** XP
508. **[OPEN]** Domain mastery
509. **[OPEN]** Certification mastery
510. **[OPEN]** Completion percentage
511. **[OPEN]** Achievement system
512. **[OPEN]** Personal best
513. **[OPEN]** Progress celebrations

---

# 26. Content Management / Admin

514. **[OPEN]** Admin login
515. **[OPEN]** Certification management
516. **[OPEN]** Domain management
517. **[OPEN]** Guide management
518. **[OPEN]** Concept management
519. **[OPEN]** Question management
520. **[OPEN]** Mock management
521. **[OPEN]** Case-study management
522. **[OPEN]** Reference management
523. **[OPEN]** Question tagging
524. **[OPEN]** Difficulty management
525. **[OPEN]** Source/reference management
526. **[OPEN]** Publish/unpublish
527. **[OPEN]** Draft system
528. **[OPEN]** Content versioning
529. **[OPEN]** Review status
530. **[OPEN]** Fact-check status

---

# 27. Question Quality System

531. **[OPEN]** Question review workflow
532. **[OPEN]** Content reviewer
533. **[OPEN]** Technical reviewer
534. **[OPEN]** Source verification
535. **[OPEN]** Difficulty validation
536. **[OPEN]** Distractor validation
537. **[OPEN]** Duplicate detection
538. **[OPEN]** Outdated-question detection
539. **[OPEN]** User-reported question issue
540. **[OPEN]** Question feedback
541. **[OPEN]** Question analytics

---

# 28. Trust & Integrity

542. **[OPEN]** Original content policy
543. **[OPEN]** No leaked exam questions
544. **[OPEN]** Source attribution
545. **[OPEN]** Fact-checking
546. **[OPEN]** Content review dates
547. **[OPEN]** Transparent scoring
548. **[OPEN]** No fake score predictions
549. **[OPEN]** Secure answer keys
550. **[OPEN]** Server-side grading
551. **[OPEN]** Randomized options
552. **[OPEN]** Question randomization
553. **[OPEN]** Anti-cheating measures
554. **[OPEN]** Responsible certification disclaimer

---

# 29. Feedback & Support

555. **[OPEN]** Feedback form
556. **[OPEN]** Report broken content
557. **[OPEN]** Report content error
558. **[OPEN]** Suggest feature
559. **[OPEN]** Contact support
560. **[OPEN]** FAQ
561. **[OPEN]** Support page
562. **[OPEN]** Contribution/donation option

---

# 30. UI / UX

563. **[OPEN]** Responsive design
564. **[OPEN]** Mobile-first
565. **[OPEN]** Desktop layout
566. **[OPEN]** Dark mode
567. **[OPEN]** Light mode
568. **[OPEN]** Liquid glass surfaces
569. **[OPEN]** Glass cards
570. **[OPEN]** Subtle backdrop blur
571. **[OPEN]** Premium typography
572. **[OPEN]** Clear hierarchy
573. **[OPEN]** Consistent spacing
574. **[OPEN]** Consistent buttons
575. **[OPEN]** Consistent cards
576. **[OPEN]** Consistent badges
577. **[OPEN]** Progress animations
578. **[OPEN]** Micro-interactions
579. **[OPEN]** Skeleton loading
580. **[OPEN]** Empty states
581. **[OPEN]** Error states
582. **[OPEN]** Success states
583. **[OPEN]** Keyboard accessibility
584. **[OPEN]** Screen-reader accessibility

---

# 31. Navigation

585. **[OPEN]** Global header
586. **[OPEN]** Certification selector
587. **[OPEN]** Search
588. **[OPEN]** Learn
589. **[OPEN]** Practice
590. **[OPEN]** Mock Exams
591. **[OPEN]** Dashboard
592. **[OPEN]** Profile
593. **[OPEN]** Mobile navigation
594. **[OPEN]** Breadcrumbs
595. **[OPEN]** Sidebar navigation
596. **[OPEN]** Previous/Next navigation

---

# 32. Technical / Performance

597. **[OPEN]** Fast page load
598. **[OPEN]** SEO-friendly pages
599. **[OPEN]** Server-side rendering where appropriate
600. **[OPEN]** Static content generation
601. **[OPEN]** Lazy loading
602. **[OPEN]** Image optimization
603. **[OPEN]** Code splitting
604. **[OPEN]** Caching
605. **[OPEN]** Secure authentication
606. **[OPEN]** Secure answer keys
607. **[OPEN]** API authorization
608. **[OPEN]** Rate limiting
609. **[OPEN]** Error monitoring
610. **[OPEN]** Analytics
611. **[OPEN]** Database backups

---

# 33. SEO / Content Discovery

612. **[OPEN]** SEO metadata
613. **[OPEN]** Open Graph metadata
614. **[OPEN]** Structured data
615. **[OPEN]** Certification landing pages
616. **[OPEN]** Domain landing pages
617. **[OPEN]** Concept pages
618. **[OPEN]** Guide pages
619. **[OPEN]** Question pages where appropriate
620. **[OPEN]** Internal linking
621. **[OPEN]** Sitemap
622. **[OPEN]** Robots.txt
623. **[OPEN]** Canonical URLs
624. **[OPEN]** Search-friendly URLs

---

# 34. The Core Product Loop

This should be considered the **highest-priority feature checklist**:

625. **[OPEN]** Learn
626. **[OPEN]** Practice
627. **[OPEN]** Get explanation
628. **[OPEN]** Track result
629. **[OPEN]** Track confidence
630. **[OPEN]** Identify weakness
631. **[OPEN]** Recommend next topic
632. **[OPEN]** Practice weakness
633. **[OPEN]** Take mock
634. **[OPEN]** Analyze mock
635. **[OPEN]** Update readiness
636. **[OPEN]** Repeat

### Final experience

```text
Learn
  ↓
Practice
  ↓
Understand
  ↓
Measure
  ↓
Find Weakness
  ↓
Adaptive Practice
  ↓
Mock Exam
  ↓
Readiness
  ↓
Certification
```

This is the **master checklist I'd use as the product requirements baseline** for your reference implementation.