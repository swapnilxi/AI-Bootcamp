# AI Bootcamp – Todo & Roadmap

## ✅ Completed

- [x] Click-to-open instructor/healer profile from cards on /instructors
- [x] AI Twin consultation modal (ReactMarkdown formatting, body scroll lock, isolated scroll)
- [x] Custom profile sections editor (predefined templates + fully custom)
- [x] Acharya Lakshmi profile seeded end-to-end (courses, bookings, AI Twin, sections)
- [x] Prisma schema: profileSections field on User
- [x] Deployed to Vercel: https://ai-bootcamp.vercel.app
- [x] **Classes & Booking extracted into self-contained features** under `src/features/` (see Architecture below)

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
- [ ] Apply the same treatment to **instructors/practitioners** (`src/app/instructors/[id]/page.tsx` is 1457 lines) and **blog**
- [ ] Extract the shared `@/components/ui` primitives a feature may depend on into a documented, versioned set
- [ ] Add an ESLint `no-restricted-imports` rule banning deep `@/features/*/...` paths from outside each feature, so the barrels can't erode
- [ ] Per-feature tests (access rules, entitlement matrix, slot resolution, DST boundaries) that run without the Next.js app
- [ ] Decide whether features graduate to workspace packages (`packages/classes`) once a second app needs them

## 🔜 Next Up
- [ ] Image upload for instructor avatar (replace placeholder paths)
- [ ] Gallery section support in ProfileSectionsRenderer (real images)
- [ ] Drag-and-drop reordering for profile sections (react-beautiful-dnd or similar)
- [ ] Seed more instructor profiles for the demo (2–3 more practitioners)
- [ ] Admin approval workflow UI polish
- [ ] Student / seeker dashboard improvements
- [ ] Email notification templates

## 🔒 Security (from code review, 2026-10-04)

_Items struck through were fixed on 2026-10-05 alongside the features refactor._

- [ ] **Role forgery**: remove `session.user.role` handling from the `trigger === "update"` branch in `src/lib/auth.ts` (any user can self-promote to SUPER_ADMIN)
- [x] ~~Booking tokens: removed the hardcoded fallback secret~~ — `features/booking/server/access.ts` now uses `BOOKING_TOKEN_SECRET`, or a domain-separated HMAC of `NEXTAUTH_SECRET`, and throws if neither is set
- [ ] Remove the same hardcoded fallback secret from `src/lib/auth.ts` and throw if `NEXTAUTH_SECRET` is unset *(left alone: changing it invalidates live sessions — do it with a deploy window)*
- [ ] Login: validate `callbackUrl` (same-origin paths only) – open redirect in `src/app/(auth)/login/page.tsx`
- [ ] Login: hide demo credentials (incl. admin password) in production
- [x] ~~`/api/classes/[id]/unlock`~~ — now requires a session, runs the full entitlement check, never returns `content` to anonymous callers, no longer leaks materials for non-protected classes, and rate-limits per account+IP
- [x] ~~`/api/classes/[id]/enroll`~~ — gated behind `hasClassEntitlement()`; paid classes return **402** unless the host app registers a resolver (`setPaidEntitlementResolver`)
- [x] ~~Wire a real payment provider~~ — Stripe Checkout + webhook, `Entitlement` table, enforced enrolment policy (see below)
- [ ] **Heads-up:** booking tokens are now derived from a new key, so any guest `?t=` link emailed before 2026-10-05 no longer verifies. Set `BOOKING_TOKEN_SECRET` before launch and treat rotating it as invalidating outstanding links.
- [ ] `/api/instructors/[id]/ai-chat`: add `aiPreflight`, `sanitizeChat`, rate limit, approval check, input validation
- [ ] `/api/instructors/[id]/ai-persona`: zod-validate input/output, cap lengths, rate limit, require instructor role
- [ ] Booking ownership by unverified email → add email verification or match on `userId` only
- [x] ~~Double-booking race~~ — create and both reschedule paths now re-check the slot inside a `$transaction` via `assertSlotStillFree()` and return 409 `SlotTakenError`
- [ ] Add a range-exclusion constraint as a second line of defence (needs Postgres; SQLite can't express it)
- [ ] Move off per-instance SQLite `/tmp` on Vercel to a hosted DB
- [ ] Strip private fields from public responses (`aiSystemPrompt`, `rejectionReason`, nudge fields, class `passwordHash`)
- [ ] Password reset: email token in prod, hash token, rate limit, invalidate sessions
- [ ] Rate limiter: trust platform IP header, atomic increment; login limiter keyed by email+IP, count failures only
- [x] ~~Rejected/pending instructors keep edit rights~~ — `getClassAccess()` now revokes `canManage` unless the instructor's own `approvalStatus` is `APPROVED` (admins exempt)
- [ ] Re-review approved classes/lessons on material edits
- [x] ~~Meeting links~~ — `meetingLinkSchema` in `features/booking/schemas/booking.ts` now rejects non-`http(s)` URLs
- [ ] Same validation for lesson video URLs and profile-section links
- [ ] Anonymous booking spam: verification/CAPTCHA, cap pending bookings, expire stale PENDING
- [ ] Remove `prisma/dev.db` from git
- [ ] Zod schemas for instructor/service/blog writes; return 400 (not 500) on malformed JSON
- [ ] Gate lesson/AI-lesson endpoints on class + lesson approval; concierge shouldn't list unapproved classes

## 📚 Classes — feature roadmap

Each item is scoped to stay inside `src/features/classes/`, so it ships as part of
the reusable feature rather than as app-specific glue. Where an item needs
something the host application owns (payments, storage, video), it is expressed
as a **port**: the feature defines the interface, the app provides the adapter —
the pattern already used by `setPaidEntitlementResolver`.

### Learning experience
- [ ] **Resume where you left off** — persist last-viewed lesson per enrolment; "Continue" CTA on `ClassCard` and the class page
- [ ] **Progress model** — per-lesson completion already exists; add per-class percentage, streaks, and an `onProgress` event port so a host app can mirror it into its own analytics
- [ ] **Quizzes as a first-class type** — the `/lessons/[id]/quiz` endpoint exists but has no authored question model; add `schemas/quiz.ts`, question banks, attempts, pass marks, and retake rules
- [ ] **Certificates** — issue on completion (configurable threshold); render as a shareable page plus PDF, signed so it can be verified
- [ ] **Notes & bookmarks** — per-lesson private notes and timestamped video bookmarks, exportable as Markdown
- [ ] **Transcripts & search** — store lesson transcripts; full-text search across a class, deep-linking to the timestamp
- [ ] **Downloadable materials** — attachments per lesson behind the same access check as `content`, via a `FileStorage` port (S3/R2/local)
- [ ] **Accessibility pass** — captions on lesson video, keyboard-navigable lesson list, focus management in `PasswordUnlockModal`

### Monetisation & access
- [x] ~~**Payments**~~ — Stripe Checkout (`POST /api/classes/[id]/checkout`) + signed webhook (`POST /api/webhooks/stripe`) writing an `Entitlement` row; `ClassCard` shows "Enroll · $49" and redirects. Only the webhook grants access; replays are idempotent via `providerRef`.
- [ ] Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` — until then `/checkout` returns 503 and paid classes stay closed
- [ ] End-to-end test with `stripe listen --forward-to localhost:3006/api/webhooks/stripe` and a test card
- [ ] Receipts, tax/VAT, and refund handling (`charge.refunded` -> revoke the entitlement)
- [ ] Admin "grant access" action writing `Entitlement{ source: "admin_grant" }`
- [ ] **Cohorts & drip scheduling** — release lessons on a schedule relative to enrolment or to a fixed cohort start date
- [ ] **Coupons, trials and bundles** — percentage/fixed discounts, time-limited free access, multi-class bundles
- [ ] **Refunds and revocation** — revoking an entitlement must immediately close `canViewContent`
- [ ] **Seat limits and waitlists** — cap enrolment per class; waitlist with automatic promotion
- [ ] **Gifting / team seats** — one payer, many seats, with an invite flow

### Instructor tooling
- [ ] **Bulk lesson authoring** — paste an outline, get draft lessons; CSV/Markdown import
- [ ] **AI lesson drafts** — `/api/ai/lesson-draft` exists; surface it in `LessonManager` with accept/revise/discard per section
- [ ] **Class templates & duplication** — clone a class with its lesson structure; save a class as a reusable template
- [ ] **Scheduled publishing** — publish at a future time; currently `isPublished` is a manual boolean
- [ ] **Analytics** — enrolment over time, completion rate, per-lesson drop-off, quiz score distribution; expose as a feature-owned endpoint so the dashboard stays thin
- [ ] **Revision workflow** — editing an approved class should re-queue it for review (see the open item in Security)
- [ ] **Drag-and-drop lesson reordering** — the reorder endpoint exists; `LessonManager` still uses up/down buttons
- [ ] **Preview as student** — render the class exactly as an unenrolled or enrolled learner would see it

### Social & engagement
- [ ] **Per-lesson discussions** — threaded comments scoped to a lesson, visible only to people with content access
- [ ] **Q&A with instructor answers** — upvoting, "answered" state, and a digest to the instructor
- [ ] **Reviews & ratings** — only from enrolled learners past a completion threshold; aggregate onto `ClassCard`
- [ ] **Announcements** — instructor broadcasts to a class, delivered through the existing `@/lib/notify` channels
- [ ] **Cohort chat / study groups** — opt-in, per-cohort, with the same access gate as content
- [ ] **Completion leaderboards & badges** — opt-in, privacy-respecting, off by default
- [ ] **Shareable progress** — "I completed X" card with an OG image, linking back to the public class page

## 🐞 Bugs

### Tailwind dropped every class unique to `src/features` (fixed 2026-10-05)
Moving components into `src/features/**` left them outside `tailwind.config.ts`'s
`content` globs, so Tailwind never saw those files and omitted any utility used
*only* there — `p-7` among them, which is why class cards rendered with no padding.
Nine classes were being dropped (~2 KB of CSS). Typecheck, `next build` and HTTP
status checks all pass with the CSS missing, so nothing caught it automatically.

- [x] ~~Add `./src/features/**/*.{js,ts,jsx,tsx,mdx}` to the Tailwind `content` globs~~
- [ ] Any future top-level source directory must be added to those globs too — worth a comment or a lint check
- [ ] Note: editing `tailwind.config.ts` does **not** hot-reload; the dev server must be restarted


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

- [x] ~~`startup.sh` frees the port first and exports `NEXT_DIST_DIR=.next-dev`~~ — covers the path where the IDE runs that script
- [ ] **Still open:** a server the IDE launches directly (`next dev`, port 3000, default `.next`) has no such guard. Put the check in `npm run dev` itself so it holds however the server is started
- [ ] Never run `next build` against the same build directory a dev server is using (`next build` cleans it)
- [ ] Consider having `npm run dev` itself refuse to start when the port is already held, so the guard doesn't depend on `startup.sh`

- [ ] "Add/Edit Profile Sections" links: scroll to `#profile-sections` after `profile` loads (section only renders when `profile` is set); show button only when available
- [ ] Add try/catch/finally + error/retry UI: instructor dashboard, AdminBookings, AdminClients, AdminAvailability, LessonManager, book page — *classes page done via `useClasses`*
- [ ] AbortController / request-id guards for stale responses (admin search, instructor filters, instructor profile, lesson nav, SlotPicker) — *classes catalog done via `useClasses`*
- [ ] PractitionerBookingModal: don't overwrite typed fields on session refetch; reset state per practitioner; pass `serviceId` instead of using first service
- [ ] Shared accessible `Modal` (role=dialog, Escape, focus trap/restore, scroll lock, inert siblings); apply to booking, AI chat, password unlock, template picker, mobile menu, drawer
- [ ] Close AccountMenu on navigation
- [ ] Dashboard hub: handle authenticated session with no role; use `router.replace`
- [ ] InstructorAiChatModal: persist saved persona to parent, abort in-flight requests, clean up timers
- [ ] Booking confirmation: don't show "not found" on transient refetch error
- [ ] Notification logs: record real delivery result instead of hardcoded "SENT"; cron reminders only mark sent on success
- [ ] Format notification times in the booking timezone (not server locale)
- [ ] Fix 8 `useEffect` missing-dep lint warnings (blog, classes, class edit, AdminPractitioners, InstructorAiChatModal, PractitionerBookingModal, SlotPicker)
- [ ] Booking wizard service cards: make keyboard-accessible (`button`/radio) and add error/empty state

## 🎨 UI / Look & Feel
- [ ] Replace raw `<img>` with `next/image` (7 files) + initials fallback; show avatar in ClassCard
- [ ] Design tokens: gold-light/dark, status (success/warn/danger/info), overlay surface; replace hardcoded hex/raw palette colors (instructor profile, instructor dashboard, admin, ClassCard)
- [ ] Shared primitives: `Input/Select/Textarea`, `Toggle`, `Card`, `Alert`, `Badge`, `StatCard`, `Skeleton`; add `loading` prop to `Button`; use `Button` in ClassCard
- [ ] Add `loading.tsx` / `error.tsx` for classes, instructors, my-bookings, book, dashboard, profile; visible `role="alert"` errors
- [ ] Keyboard focus rings on inputs/toggles; make instructor cards real links
- [ ] Performance: static/tiled grain overlay, drop blur-reveal on mobile, reduce `backdrop-blur`, cap WebGL pixel ratio/particles on mobile
- [ ] Reduced-motion safety net + hide cursor glow; wrap hover effects in `@media (hover:hover)`
- [ ] Scope global 44px min-height to buttons/tap targets; root font-size 100%; min text size 11–12px; fix placeholder/input-border contrast; add `color-scheme: dark`
- [ ] Use `100dvh`, allow CTA wrapping at 320px, `text-base` inputs on mobile (avoid iOS zoom)
- [ ] Split 1457-line `instructors/[id]/page.tsx` into section components

## ✨ UI Enrichments
- [ ] Skeleton loaders shaped like the real cards (classes, instructors, bookings, dashboards) instead of "Loading…" text
- [ ] Richer empty states: icon/illustration, helper text and a CTA (e.g. "Browse practitioners", "Clear filters")
- [ ] Toast system (success/error/info) to replace `alert()`/`prompt()` in the instructor and admin dashboards
- [ ] Instructor cards: rating/review count, next-available-slot chip, modality tags, and a clear "Book" CTA
- [ ] Instructor profile: sticky booking bar on mobile, section jump-nav with scroll-spy, and a real gallery/lightbox
- [ ] Booking flow: stepper with progress, summary sidebar, calendar-style date picker with timezone label, and "Add to calendar" (.ics) on confirmation
- [ ] AI chat: typing indicator, copy/regenerate message actions, suggested follow-up chips, and safe-area/`100dvh` sizing on mobile
- [ ] Search, filters and sort on instructors and classes (modality, price, availability), with active-filter chips and URL-synced state
- [ ] Dashboard: stat cards with trend indicators, status badges for bookings (pending/confirmed/cancelled), and mobile-friendly tables
- [ ] Form UX: inline validation, character counters, password strength meter, and autosave drafts for profile sections
- [ ] Profile sections editor: drag-and-drop reordering with live preview
- [ ] Image upload for avatars and galleries with crop and preview
- [ ] Page transitions and micro-interactions (button press, card hover lift, animated tab underline) that respect reduced motion
- [ ] Light/dark or "daylight" theme toggle (needs the token cleanup first)
- [ ] Testimonials/social proof carousel on instructor pages and the home page
- [ ] Zodiac-themed accents: sign-based gradient on user profile and horoscope teaser card on the user dashboard
- [ ] Global command/search palette (Cmd+K) for classes, practitioners and pages
- [ ] Breadcrumbs and a "back" affordance on deep pages (lessons, class edit, instructor profile)
- [ ] Consistent notification bell with unread count for booking and approval updates


Absolutely. Here is the **master feature checklist** you can use as the reference/spec checklist while building your version.

# Certification Learning Platform — Master Feature Checklist

## 1. Authentication & Account

- [ ] Email/password registration
- [ ] Email/password login
- [ ] Google OAuth login
- [ ] Logout
- [ ] Forgot password
- [ ] Reset password
- [ ] User profile
- [ ] Persistent login/session
- [ ] Account settings
- [ ] User-specific progress storage
- [ ] User-specific attempt history

---

## 2. Homepage / Landing Page

- [ ] Premium hero section
- [ ] Clear product positioning
- [ ] Primary CTA — Start Learning
- [ ] Primary CTA — Practice
- [ ] CTA — Take Mock Exam
- [ ] Certification overview
- [ ] Certification cards
- [ ] Domain/skill overview
- [ ] Learning methodology section
- [ ] Practice methodology section
- [ ] Adaptive learning explanation
- [ ] Scenario-based learning explanation
- [ ] Trust / credibility section
- [ ] FAQ
- [ ] Footer navigation
- [ ] Login/Register CTA
- [ ] Responsive mobile layout

---

# 3. Certification System

- [ ] Certification listing page
- [ ] Individual certification landing page
- [ ] Certification overview
- [ ] Exam objectives
- [ ] Exam domains
- [ ] Domain weight percentages
- [ ] Exam question count
- [ ] Exam duration
- [ ] Passing score
- [ ] Exam cost
- [ ] Exam delivery information
- [ ] Eligibility information
- [ ] Official exam resources
- [ ] Certification-specific study plan

---

# 4. Certification Navigation

Each certification should have:

- [ ] Overview
- [ ] Exam Guide
- [ ] Study Guides
- [ ] Concepts
- [ ] Practice
- [ ] Domain Practice
- [ ] Adaptive Practice
- [ ] Readiness Check
- [ ] Mock Exams
- [ ] Case Studies
- [ ] References / Cheat Sheets
- [ ] FAQ

---

# 5. Study Guide System

- [ ] Study guide library
- [ ] Guides grouped by domain
- [ ] Individual guide pages
- [ ] Estimated reading time
- [ ] Breadcrumb navigation
- [ ] Table of contents
- [ ] Previous/next guide navigation
- [ ] Related guides
- [ ] Related concepts
- [ ] Key takeaways
- [ ] Practical examples
- [ ] Architecture examples
- [ ] Code examples
- [ ] Decision rules
- [ ] Common mistakes
- [ ] Exam tips
- [ ] FAQ per guide
- [ ] "Practice this topic" CTA
- [ ] Bookmark/save guide

---

# 6. Concept Library

- [ ] Global concept library
- [ ] Concept cards
- [ ] Concept search
- [ ] Concept filtering
- [ ] Concept categories
- [ ] Definition
- [ ] Why it matters
- [ ] When to use
- [ ] When not to use
- [ ] Practical example
- [ ] Exam relevance
- [ ] Common trap
- [ ] Related concepts
- [ ] Similar concepts
- [ ] Detailed explanation
- [ ] Practice questions for concept
- [ ] Copy concept as Markdown

---

# 7. "Frequently Confused" Concepts

- [ ] Confused-concept library
- [ ] A vs B comparisons
- [ ] Difference table
- [ ] When to use A
- [ ] When to use B
- [ ] Common exam trap
- [ ] Example scenario
- [ ] Quick decision rule
- [ ] Practice question

Examples:

- [ ] Tools vs structured output
- [ ] Hooks vs tools
- [ ] CLAUDE.md vs rules
- [ ] Resume vs compact vs new session
- [ ] Context window vs memory
- [ ] Chaining vs dynamic decomposition

---

# 8. Question Bank

- [ ] Central question database
- [ ] Question categories
- [ ] Certification mapping
- [ ] Domain mapping
- [ ] Objective mapping
- [ ] Difficulty level
- [ ] Question type
- [ ] Scenario-based questions
- [ ] Single-choice questions
- [ ] Multiple-choice questions
- [ ] True/false
- [ ] Matching
- [ ] Sorting
- [ ] Ordering
- [ ] Scenario branching

---

# 9. Question Metadata

Every question should support:

- [ ] Question ID
- [ ] Certification
- [ ] Domain
- [ ] Objective
- [ ] Difficulty
- [ ] Question type
- [ ] Scenario
- [ ] Options
- [ ] Correct answer
- [ ] Correct-answer explanation
- [ ] Individual distractor explanations
- [ ] Related concept
- [ ] Related guide
- [ ] Tags
- [ ] Source/reference
- [ ] Creation date
- [ ] Last reviewed date

---

# 10. Practice Engine

- [ ] Start practice
- [ ] Select certification
- [ ] Select domain
- [ ] Select difficulty
- [ ] Select question count
- [ ] Mixed practice
- [ ] Domain practice
- [ ] Objective practice
- [ ] Concept practice
- [ ] Random practice
- [ ] Timed practice
- [ ] Untimed practice
- [ ] Question navigation
- [ ] Progress indicator
- [ ] Submit answer
- [ ] Explanation after answer
- [ ] Correct/incorrect state
- [ ] Next question
- [ ] Retry incorrect questions

---

# 11. Answer Explanation System

After answering:

- [ ] Correct/incorrect indicator
- [ ] Correct answer
- [ ] Why correct
- [ ] Why option A is wrong
- [ ] Why option B is wrong
- [ ] Why option C is wrong
- [ ] Why option D is wrong
- [ ] Concept explanation
- [ ] Exam trap
- [ ] Decision rule
- [ ] Related study guide
- [ ] Practice this concept
- [ ] Next question

---

# 12. Confidence Tracking

Before/after answering:

- [ ] Low confidence
- [ ] Medium confidence
- [ ] High confidence

Track:

- [ ] Confidence + correct
- [ ] Confidence + incorrect
- [ ] Low confidence + correct
- [ ] Low confidence + incorrect
- [ ] High-confidence mistakes

Specially identify:

- [ ] **Confident + Wrong**
- [ ] **Uncertain + Wrong**

---

# 13. Domain Practice

- [ ] Domain listing
- [ ] Domain description
- [ ] Domain weight
- [ ] Domain question count
- [ ] Domain practice
- [ ] Domain score
- [ ] Domain accuracy
- [ ] Domain history
- [ ] Domain weaknesses
- [ ] Domain recommendations
- [ ] Retry domain
- [ ] Practice weak domain

---

# 14. Adaptive Practice

- [ ] Track historical accuracy
- [ ] Track objective accuracy
- [ ] Track domain accuracy
- [ ] Track recency
- [ ] Track difficulty
- [ ] Track confidence
- [ ] Identify weak objectives
- [ ] Identify weak domains
- [ ] Calculate weakness score
- [ ] Recommend next questions
- [ ] Prioritize recently missed concepts
- [ ] Prioritize high-confidence mistakes
- [ ] Adjust difficulty
- [ ] Adaptive question selection
- [ ] Personalized practice set

### Adaptive algorithm

- [ ] Accuracy
- [ ] Domain importance
- [ ] Objective importance
- [ ] Recency
- [ ] Confidence error
- [ ] Difficulty
- [ ] Question history

---

# 15. Daily Question

- [ ] Question of the day
- [ ] Daily scenario
- [ ] Submit answer
- [ ] Explanation
- [ ] Domain
- [ ] Concept
- [ ] Daily completion
- [ ] Daily streak
- [ ] Previous daily questions
- [ ] Practice similar questions

---

# 16. Mock Exams

- [ ] Mock exam listing
- [ ] Multiple mock exams
- [ ] Exam simulation mode
- [ ] Exam timer
- [ ] Question counter
- [ ] Progress indicator
- [ ] All-domain questions
- [ ] Scenario questions
- [ ] Single-choice questions
- [ ] Multiple-response questions
- [ ] Question navigation
- [ ] Flag question
- [ ] Review unanswered
- [ ] Submit exam
- [ ] Auto grading
- [ ] Final score
- [ ] Domain breakdown
- [ ] Objective breakdown
- [ ] Question review
- [ ] Detailed explanations
- [ ] Weak-area identification
- [ ] Mock history

---

# 17. Readiness Assessment

- [ ] Readiness check
- [ ] Rate confidence per domain
- [ ] 1–5 confidence scale
- [ ] Domain weighting
- [ ] Weighted readiness score
- [ ] Strong domains
- [ ] Weak domains
- [ ] Priority areas
- [ ] Recommended study topics
- [ ] Readiness history
- [ ] Reassessment
- [ ] Progress comparison

---

# 18. Enterprise Case Studies

- [ ] Case-study library
- [ ] Healthcare scenario
- [ ] Insurance scenario
- [ ] FinTech scenario
- [ ] Retail scenario
- [ ] Government scenario
- [ ] Manufacturing scenario
- [ ] Shared business context
- [ ] Architecture context
- [ ] Multiple linked questions
- [ ] Changing requirements
- [ ] Changing constraints
- [ ] Architecture decisions
- [ ] Confidence rating
- [ ] Case-study score
- [ ] Detailed explanation
- [ ] Decision analysis
- [ ] Case-study completion tracking

---

# 19. Search

- [ ] Global search
- [ ] Search guides
- [ ] Search concepts
- [ ] Search questions
- [ ] Search mock exams
- [ ] Search case studies
- [ ] Search references
- [ ] Search certifications
- [ ] Search suggestions
- [ ] Search results grouping
- [ ] Content-type filtering
- [ ] Certification filtering
- [ ] Domain filtering

---

# 20. Dashboard

## Personal Dashboard

- [ ] Overall readiness
- [ ] Current certification
- [ ] Overall accuracy
- [ ] Questions answered
- [ ] Questions remaining
- [ ] Study time
- [ ] Current streak
- [ ] Domain performance
- [ ] Weak domains
- [ ] Strong domains
- [ ] Recent activity
- [ ] Mock scores
- [ ] Readiness score
- [ ] Recommended next action

### "What should I do next?"

- [ ] Recommended guide
- [ ] Recommended concept
- [ ] Recommended practice
- [ ] Recommended mock
- [ ] Recommended case study

---

# 21. Progress Analytics

- [ ] Overall accuracy
- [ ] Domain accuracy
- [ ] Objective accuracy
- [ ] Question difficulty performance
- [ ] Average question time
- [ ] Mock scores
- [ ] Readiness score
- [ ] Study time
- [ ] Attempt history
- [ ] Accuracy over time
- [ ] Domain improvement over time
- [ ] Weakness trend
- [ ] Confidence vs accuracy
- [ ] High-confidence mistakes
- [ ] Learning streak

---

# 22. Study Plan

- [ ] Create study plan
- [ ] Exam date
- [ ] Target certification
- [ ] Daily study goal
- [ ] Weekly study goal
- [ ] Recommended guides
- [ ] Recommended practice
- [ ] Recommended mocks
- [ ] Recommended case studies
- [ ] Progress against plan
- [ ] Daily tasks
- [ ] Weekly milestones
- [ ] Automatic plan adjustment

---

# 23. References / Cheat Sheets

- [ ] Domain blueprint
- [ ] Exam cheat sheet
- [ ] Flashcards
- [ ] Study plan
- [ ] Decision matrices
- [ ] Architecture patterns
- [ ] Judgment traps
- [ ] Quick-reference guides
- [ ] Printable references
- [ ] Downloadable PDF
- [ ] Markdown export

---

# 24. AI Features — Recommended Upgrade

- [ ] AI tutor
- [ ] Ask about a concept
- [ ] Explain like I'm five
- [ ] Explain at architect level
- [ ] Generate examples
- [ ] Generate scenarios
- [ ] Explain why answer is wrong
- [ ] Compare two concepts
- [ ] AI-generated practice
- [ ] AI-generated revision
- [ ] Personalized study recommendations
- [ ] AI study-plan generation
- [ ] Voice explanation
- [ ] AI conversation history

---

# 25. Gamification

- [ ] Daily streak
- [ ] Weekly streak
- [ ] Learning milestones
- [ ] Badges
- [ ] XP
- [ ] Domain mastery
- [ ] Certification mastery
- [ ] Completion percentage
- [ ] Achievement system
- [ ] Personal best
- [ ] Progress celebrations

---

# 26. Content Management / Admin

- [ ] Admin login
- [ ] Certification management
- [ ] Domain management
- [ ] Guide management
- [ ] Concept management
- [ ] Question management
- [ ] Mock management
- [ ] Case-study management
- [ ] Reference management
- [ ] Question tagging
- [ ] Difficulty management
- [ ] Source/reference management
- [ ] Publish/unpublish
- [ ] Draft system
- [ ] Content versioning
- [ ] Review status
- [ ] Fact-check status

---

# 27. Question Quality System

- [ ] Question review workflow
- [ ] Content reviewer
- [ ] Technical reviewer
- [ ] Source verification
- [ ] Difficulty validation
- [ ] Distractor validation
- [ ] Duplicate detection
- [ ] Outdated-question detection
- [ ] User-reported question issue
- [ ] Question feedback
- [ ] Question analytics

---

# 28. Trust & Integrity

- [ ] Original content policy
- [ ] No leaked exam questions
- [ ] Source attribution
- [ ] Fact-checking
- [ ] Content review dates
- [ ] Transparent scoring
- [ ] No fake score predictions
- [ ] Secure answer keys
- [ ] Server-side grading
- [ ] Randomized options
- [ ] Question randomization
- [ ] Anti-cheating measures
- [ ] Responsible certification disclaimer

---

# 29. Feedback & Support

- [ ] Feedback form
- [ ] Report broken content
- [ ] Report content error
- [ ] Suggest feature
- [ ] Contact support
- [ ] FAQ
- [ ] Support page
- [ ] Contribution/donation option

---

# 30. UI / UX

- [ ] Responsive design
- [ ] Mobile-first
- [ ] Desktop layout
- [ ] Dark mode
- [ ] Light mode
- [ ] Liquid glass surfaces
- [ ] Glass cards
- [ ] Subtle backdrop blur
- [ ] Premium typography
- [ ] Clear hierarchy
- [ ] Consistent spacing
- [ ] Consistent buttons
- [ ] Consistent cards
- [ ] Consistent badges
- [ ] Progress animations
- [ ] Micro-interactions
- [ ] Skeleton loading
- [ ] Empty states
- [ ] Error states
- [ ] Success states
- [ ] Keyboard accessibility
- [ ] Screen-reader accessibility

---

# 31. Navigation

- [ ] Global header
- [ ] Certification selector
- [ ] Search
- [ ] Learn
- [ ] Practice
- [ ] Mock Exams
- [ ] Dashboard
- [ ] Profile
- [ ] Mobile navigation
- [ ] Breadcrumbs
- [ ] Sidebar navigation
- [ ] Previous/Next navigation

---

# 32. Technical / Performance

- [ ] Fast page load
- [ ] SEO-friendly pages
- [ ] Server-side rendering where appropriate
- [ ] Static content generation
- [ ] Lazy loading
- [ ] Image optimization
- [ ] Code splitting
- [ ] Caching
- [ ] Secure authentication
- [ ] Secure answer keys
- [ ] API authorization
- [ ] Rate limiting
- [ ] Error monitoring
- [ ] Analytics
- [ ] Database backups

---

# 33. SEO / Content Discovery

- [ ] SEO metadata
- [ ] Open Graph metadata
- [ ] Structured data
- [ ] Certification landing pages
- [ ] Domain landing pages
- [ ] Concept pages
- [ ] Guide pages
- [ ] Question pages where appropriate
- [ ] Internal linking
- [ ] Sitemap
- [ ] Robots.txt
- [ ] Canonical URLs
- [ ] Search-friendly URLs

---

# 34. The Core Product Loop

This should be considered the **highest-priority feature checklist**:

- [ ] Learn
- [ ] Practice
- [ ] Get explanation
- [ ] Track result
- [ ] Track confidence
- [ ] Identify weakness
- [ ] Recommend next topic
- [ ] Practice weakness
- [ ] Take mock
- [ ] Analyze mock
- [ ] Update readiness
- [ ] Repeat

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