# AI Bootcamp Astrology Platform — Project Roadmap & Checklist 

Comprehensive tracking of completed milestones, design system implementation, consultation booking flow, and upcoming capabilities.

---

## [x] Completed Milestones

### 1. Boutique Editorial Design System (Addendum Overrides)
- [x] **Color Tokens Defined in CSS Variables & Tailwind Theme** ([`src/app/globals.css`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/app/globals.css) & [`tailwind.config.ts`](file:///Users/abundance/Documents/coding/AI-Bootcamp/tailwind.config.ts)):
  - `--ink`: `#14122B` (deep midnight navy, primary dark / text)
  - `--indigo`: `#2E2A6B` (royal indigo, secondary surfaces, headings)
  - `--gold`: `#C9A24B` (antique gold, accent, CTAs, highlights)
  - `--ivory`: `#FAF7F2` (warm off-white, main background)
  - `--mist`: `#E9E5F2` (soft lavender-grey, cards, dividers)
  - `--clay`: `#B5655C` (muted rose-clay, sparing secondary accent)
- [x] **Typography & Hierarchy**:
  - Headings: Refined serif font (`Cormorant Garamond`) loaded via Google Fonts.
  - Body & UI: Clean sans-serif (`Inter`) with base font size `17px`, `line-height: 1.6`.
  - Accessible tap targets (minimum 44px for buttons, inputs, links).
  - High-visibility keyboard focus states with gold outline (`outline: 2px solid var(--gold)`).
  - Strict WCAG AA contrast compliance across ivory, white, and ink surfaces.
- [x] **Restrained 3D Direction**:
  - Exactly ONE Three.js element in the landing hero only (slow-rotating fine-line gold armillary sphere on midnight navy).
  - Static CSS fallback for `prefers-reduced-motion` and devices without WebGL.
  - Zero 3D models elsewhere on content pages to maintain calm, high-end boutique wellness aesthetic.

### 2. Reusable Component Library
- [x] **Button Component** ([`src/components/ui/Button.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/components/ui/Button.tsx)): Variants `primary` (gold), `secondary` (mist), `dark` (ink), `outline`, and direct `whatsapp`.
- [x] **Section Heading** ([`src/components/ui/SectionHeading.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/components/ui/SectionHeading.tsx)): Serif title, uppercase eyebrow badge, and warm body copy.
- [x] **Trust Badge & Metrics** ([`src/components/ui/TrustBadge.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/components/ui/TrustBadge.tsx)): Editorial statistic pills (experience, client consultations, accuracy rate).
- [x] **Accordion FAQ** ([`src/components/ui/AccordionFAQ.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/components/ui/AccordionFAQ.tsx)): Accessible single-expand consultation and class FAQ.
- [x] **Editorial Header** ([`src/components/layout/header/EditorialHeader.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/components/layout/header/EditorialHeader.tsx)): Persistent "Book a Consultation" primary CTA button on every page + WhatsApp direct link + responsive mobile sheet.
- [x] **Editorial Footer** ([`src/components/layout/footer/EditorialFooter.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/components/layout/footer/EditorialFooter.tsx)): Midnight navy footer with ethical charter, clinic hours, contact details, and directory links.
- [x] **Service Card** ([`src/components/services/ServiceCard.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/components/services/ServiceCard.tsx)): Card with transparent pricing, duration, deliverables checklist, and direct booking trigger.
- [x] **Class Card** ([`src/components/classes/ClassCard.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/components/classes/ClassCard.tsx)): Boutique card with session schedule, instructor name, and tier access badge.
- [x] **Password Unlock Modal** ([`src/components/classes/PasswordUnlockModal.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/components/classes/PasswordUnlockModal.tsx)): Modal for private masterclasses protected by bcrypt-hashed secret keys.

### 3. Consultation Express Booking Flow (Under 2 Minutes, No Account Required)
- [x] **Step 1: Choose a Service** ([`src/app/book/page.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/app/book/page.tsx)):
  - Browse available consultation offerings or pre-select directly from service catalog/deep dive.
  - Transparent duration, pricing, and deliverable badges.
- [x] **Step 2: Pick Date & Time Slot**:
  - Live availability calendar checking weekly day-of-week slots, blocked holiday dates, and booked appointment conflicts.
  - Interactive timeslot pills with real-time selection.
- [x] **Step 3: Client Details & Optional Birth Parameters**:
  - Client full name, email, phone number, and optional session notes.
  - Optional birth date, 24h birth time (`HH:mm`), and birth city/country for natal chart preparation (can be added later).
- [x] **UX Guarantees**:
  - Stepper indicator ("Step 2 of 3"), back buttons on every step, and sticky order summary drawer throughout the flow.
  - Rate limiting on bookings endpoint (5 attempts / 10 min per IP) to prevent spam and slot exhaustion.
- [x] **Booking Confirmation & Calendar Integration** ([`src/app/book/confirmation/page.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/app/book/confirmation/page.tsx)):
  - Unique booking reference code (e.g., `MS-7821`).
  - One-click Google Calendar web link with prefilled meeting details.
  - Native `.ics` iCalendar file download for Apple Calendar and Outlook.
  - Optional post-booking account creation (never forced before booking).

### 4. Database Schema & Backend API Handlers
- [x] **Prisma Database Schema** ([`prisma/schema.prisma`](file:///Users/abundance/Documents/coding/AI-Bootcamp/prisma/schema.prisma)):
  - Models for `Service`, `AvailabilitySlot`, `BlockedDate`, `Booking` (`BookingStatus`: `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`), `User`, `Class`, `Enrollment`, `RateLimitRecord`, `PlatformSetting`.
- [x] **Database Seed Data** ([`prisma/seed.ts`](file:///Users/abundance/Documents/coding/AI-Bootcamp/prisma/seed.ts)):
  - Seeded 5 consultation services (Comprehensive Natal Chart, Career & Financial Destiny, Synastry & Relationships, Muhurat Auspicious Timing, Annual Solar Return Forecast).
  - Seeded Monday–Friday clinic availability slots (10:00 to 18:00) and sample confirmed booking.
  - Seeded default accounts: Super Admin, Admin Astrologer, Subscriber, Seeker.
- [x] **API Endpoints**:
  - `/api/services` and `/api/services/[slug]`: Public listing & Admin management.
  - `/api/availability`: Live schedule calculator with conflict detection.
  - `/api/bookings` and `/api/bookings/[id]`: Guest booking creation, reference lookup, and status transitions.
  - `/api/classes`, `/api/classes/[id]`, `/api/classes/[id]/enroll`, `/api/classes/[id]/unlock`: Course catalog and protected curriculum gates.
  - `/api/profile`: Birth chart parameter updates.
  - `/api/admin/users` and `/api/admin/users/[id]/role`: RBAC management.
  - `/api/super-admin/settings`: Platform parameter overrides.

### 5. Public & Logged-In Pages (Next.js App)
- [x] **Home Page** ([`src/app/page.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/app/page.tsx)): Editorial introduction, headline promise, core services overview, 3-step consultation process, testimonials, FAQ, and WhatsApp banner.
- [x] **Services Catalog** ([`src/app/services/page.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/app/services/page.tsx)): Full directory of readings with category filters and booking triggers.
- [x] **Service Detail Page** ([`src/app/services/[slug]/page.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/app/services/%5Bslug%5D/page.tsx)): Comprehensive service overview, what's included, who it's for, what to prepare, FAQ, and sticky booking card.
- [x] **Classes Catalog & Classroom** ([`src/app/classes/page.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/app/classes/page.tsx) & [`src/app/classes/[id]/page.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/app/classes/%5Bid%5D/page.tsx)): Browse masterclasses, unlock secret classes, and access study materials.
- [x] **About Page** ([`src/app/about/page.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/app/about/page.tsx)): Astrologer lineage, classical Vedic & Western credentials, non-fatalistic philosophy.
- [x] **Contact Page** ([`src/app/contact/page.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/app/contact/page.tsx)): Direct inquiry form, WhatsApp link, clinic hours, and physical clinic address.
- [x] **Client My Bookings Page** ([`src/app/my-bookings/page.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/app/my-bookings/page.tsx)): Consultation history, status badges, video meeting links, and calendar exports.
- [x] **Profile & Natal Chart Settings** ([`src/app/profile/page.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/app/profile/page.tsx)): Birth time (`HH:mm`), birth coordinates, auto-calculated Sun sign, and enrolled courses.
- [x] **Authentication Pages** ([`src/app/(auth)/login/page.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/app/(auth)/login/page.tsx), [`/register`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/app/(auth)/register/page.tsx), [`/forgot-password`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/app/(auth)/forgot-password/page.tsx), [`/reset-password`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/app/(auth)/reset-password/page.tsx)): Clean ivory/ink styling with `<Suspense>` boundaries.
- [x] **Role Dashboards**:
  - User Dashboard ([`src/app/(dashboard)/dashboard/user/page.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/app/(dashboard)/dashboard/user/page.tsx)): Consultation shortcuts and natal sign matrix.
  - Subscriber Dashboard ([`src/app/(dashboard)/dashboard/subscriber/page.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/app/(dashboard)/dashboard/subscriber/page.tsx)): Member-only masterclasses and transit forecasts.
  - Admin Dashboard ([`src/app/(dashboard)/dashboard/admin/page.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/app/(dashboard)/dashboard/admin/page.tsx)): Live consultation bookings agenda with status changer, services overview, and classes roster.
  - Super Admin Dashboard ([`src/app/(dashboard)/dashboard/super-admin/page.tsx`](file:///Users/abundance/Documents/coding/AI-Bootcamp/src/app/(dashboard)/dashboard/super-admin/page.tsx)): User role switcher and platform setting controls.

### 6. Standalone 3D Landing Page
- [x] **Pure Single-File Landing Page** ([`public/landing.html`](file:///Users/abundance/Documents/coding/AI-Bootcamp/public/landing.html) & [`landing.html`](file:///Users/abundance/Documents/coding/AI-Bootcamp/landing.html)):
  - Built with pinned Three.js (`r128`) featuring ONE restrained gold armillary sphere on midnight navy hero.
  - Static fallback for reduced motion and non-WebGL hardware.
  - Cormorant Garamond serif headings and ivory background sections.
  - Standalone with zero build step, all CTAs routed to `APP_URL`.

### 7. Build Verification
- [x] **Production Build Clean**: Successful compilation (`npm run build` / `npx next build`) with code 0 across all 32 static and dynamic App Router routes.

---

##  Next To Be Implemented (Upcoming Capabilities)

### Priority Phase 1: Interactive Astrological Calculations & Visuals
- [ ] **Interactive Natal Chart Wheel (SVG/Canvas)**
  - Implement a 360° circular birth chart displaying the 12 astrological houses (Whole Sign / Placidus).
  - Plot planetary glyphs ( Sun,  Moon,  Mercury,  Venus,  Mars,  Jupiter,  Saturn,  Uranus,  Neptune,  Pluto) at calculated zodiac degrees.
  - Render color-coded aspect lines (conjunctions, sextiles, squares, trines, and oppositions) with orb tolerances.
- [ ] **Live Planetary Ephemeris & Transits Integration**
  - Integrate an astronomical ephemeris engine (e.g. Swiss Ephemeris / astronomy engine) to calculate current sky positions.
  - Compare current planetary transits against user birth coordinates.
  - Display daily transit alerts (e.g., "Jupiter transiting 10th House").

### Priority Phase 2: Booking Automation & Communications
- [ ] **Transactional Email Notifications (Resend / SendGrid / AWS SES)**
  - Send automated branded HTML confirmation emails immediately upon booking with meeting link and `.ics` attachment.
  - Send email reminders 24 hours and 1 hour before scheduled consultation.
  - Deliver password reset tokens and class enrollment receipts.
- [ ] **Google Calendar / Outlook Two-Way Calendar Sync**
  - Connect astrologer's Google Calendar via OAuth to auto-block personal busy slots.
  - Automatically create calendar events in the astrologer's calendar upon new booking.

### Priority Phase 3: Commercial & Member Monetization
- [ ] **Stripe Checkout & Customer Portal**
  - Support online payments for consultations ($120–$250) via Stripe Checkout.
  - Recurring subscription billing ($29/month or $290/year) for the Circle Subscriber tier.
  - Set up Stripe Webhook handler (`/api/webhooks/stripe`) to elevate role to `SUBSCRIBER` upon payment and revert on cancellation.
- [ ] **WhatsApp Business API Automated Reminders**
  - Integrate Twilio or Meta WhatsApp Cloud API for automated booking confirmation and appointment reminder pings.

### Priority Phase 4: Live Interactive Academy & Community
- [ ] **Live Video Classroom & Consultation Meeting Room**
  - Integrate Daily.co or WebRTC for one-on-one consultations directly inside `/my-bookings` and group masterclasses inside `/classes/[id]`.
- [ ] **Synastry & Relationship Compatibility Tool**
  - Build dual-chart comparison page where two seekers input birth coordinates to calculate composite scores and harmony insights.
- [ ] **Automated End-to-End Test Suite**
  - Set up Playwright / Vitest test coverage for:
    - Express consultation booking under 2 minutes (no account).
    - Booking status changes in the Admin console.
    - Password-protected class unlocking.
    - Rate limiter enforcement under burst traffic.
