# AI Bootcamp | Astrology Platform & Academy 

A complete, production-grade Astrology Platform and Academy consisting of two deployable parts:
1. **Static Landing Page (`public/landing.html` + `public/landing/`)**: Interactive 3D Three.js cosmic armillary sphere and starfield, glassmorphism cards, responsive design, zero build step, and configurable `APP_URL` redirect architecture.
2. **Next.js App Router Application (`src/`)**: Full-stack Next.js 15, TypeScript, Tailwind CSS, Prisma ORM with PostgreSQL, Auth.js (NextAuth) credentials authentication, bcrypt password hashing, Zod validation, rate limiting, and strict Role-Based Access Control (RBAC).

---

##  Architecture Overview

```
AI-Bootcamp/
 public/
    landing.html              # Standalone static landing page (served at /landing.html and /landing)
    landing/
       css/                   # tokens, base, components, header, hero, sections, footer, motion
       js/                    # config (APP_URL), smooth-scroll, header, reveal, effects, starfield, hero-sphere, main
    brand/                    # Logo SVGs, favicons, OG image
       previews/              # icon-preview.html, logo-preview.html (brand QA pages)
 prisma/
    schema.prisma             # Database models
    seed.ts                   # Seeds Super Admin, Admin, Subscriber, User, and astrology classes
 scripts/
    startup.sh                # One-command local setup + dev/prod server (SQLite)
    startup.postgres.sh       # Same, defaulting to PostgreSQL
    start-server.js           # Node wrapper around `next start`
    brand/                    # generate-brand-assets.js, its fonts, and debug renders
 docs/
    DEPLOYMENT.md             # Vercel deployment notes
    TODO.md                   # Build checklist
 src/
    app/                      # App Router routes, API route handlers, layout.tsx, template.tsx (page transitions)
    components/
       layout/header/         # EditorialHeader + DesktopNav, AccountMenu, MobileMenu, MenuToggle, nav-config
       layout/footer/         # EditorialFooter + footer-links config
       home/                  # One component per homepage section (Hero, Services, Process, Lineage, Manifesto...)
       motion/                # SmoothScrollProvider (Lenis + GSAP), MotionEffects + effects/ hooks, CountUp, ScrollDrawLine
       three/                 # Three.js components: hero armillary sphere, zodiac wheel, starfield background
       classes/ services/     # Domain components (ClassCard, LessonManager, ServiceCard, ...)
       ui/ brand/ admin/ ai/ booking/ providers/
    content/home.ts           # Homepage copy & static data (edit text here)
    lib/
       motion.ts              # Shared easing + reduced-motion helpers
       three/                 # Scene builders (armillary, zodiac wheel), glow texture, WebGL utils
       services/featured.ts   # Homepage service query with static fallback
    styles/                   # tokens, base, effects, cards, animations, reduced-motion (imported in layout.tsx)
 .env.example                 # Environment variable reference template
```

---

##  Key Features

### Part 1: Landing Page (`public/landing.html`)
- **Zero Build Step, Modular Files**: `landing.html` plus small single-purpose CSS/JS files under `public/landing/` (classic deferred scripts sharing `window.AIBootcamp`, so it works on any static host).
- **Three.js 3D Celestial Engine**: Pinned from CDN (`r128`). Renders an armillary sphere, orbital zodiac rings, 12 constellation node anchors, a pulsating celestial core, and a 2,200+ particle starfield.
- **Performance Optimized**: Capped device pixel ratio (`Math.min(devicePixelRatio, 2)`), pauses rendering when tab is hidden via `visibilitychange`, and provides a static CSS cosmic gradient fallback for devices without WebGL or with `prefers-reduced-motion: reduce`.
- **Easy Redirect Binding**: Every Book / Portal / Services link is rewritten from one setting in `public/landing/js/config.js`:
  ```javascript
  var FALLBACK_APP_URL = "https://ai-bootcamp-lms-zeta.vercel.app";
  ```
- **Responsive Black & Gold Design**: GSAP + ScrollTrigger reveals, Lenis smooth scroll, glass header, tested from 320px phones and landscape to 2560px displays, with reduced-motion support.

### Part 2: Next.js App Router Application
- **Authentication Flow**:
  - Sign up with automatic Sun sign calculation from birth date.
  - Credentials login with email & password.
  - Forgot password / reset password workflow with expiring cryptographic tokens.
- **Astrological Profiles**:
  - Profile editor with birth date, 24h birth time (`HH:mm`), birth place, biography, and avatar.
  - Automatic zodiac sign calculation (Aries through Pisces) with elements (Fire, Earth, Air, Water) and ruling planets.
- **Astrology Classes & Curriculums**:
  - Free classes open to all registered Seekers.
  - Exclusive masterclasses reserved for Mystic Subscribers.
  - Secret esoteric circles protected by access passwords (hashed with bcrypt).
  - Rate-limited password unlock endpoints to prevent brute-force attacks.
- **Strict Multi-Tier RBAC**:
  - Enforced in middleware and in every Next.js API Route Handler.
  - **USER (Seeker)**: Manage profile, browse public classes, enroll in free classes, unlock password circles.
  - **SUBSCRIBER (Mystic)**: All User features + full access to subscriber masterclasses, predictive transit tools, and mentor salons.
  - **ADMIN (Astrologer)**: All Subscriber features + create, edit, delete classes, view student enrollments, inspect user rosters.
  - **SUPER_ADMIN (High Priest)**: All Admin features + assign/revoke user roles dynamically, manage admins, configure platform-wide settings.
- **Interactive Role-Based Dashboards**:
  - `/dashboard/user`: Natal matrix, enrolled courses, recommended free lessons.
  - `/dashboard/subscriber`: Subscriber masterclass catalog, ephemeris transit preview, VIP perks.
  - `/dashboard/admin`: Class management table, enrollment statistics, student roster.
  - `/dashboard/super-admin`: Interactive role assignment switcher, platform configuration parameters, security telemetry.

---

##  Security Architecture

1. **Password Hashing**: Passwords for both user accounts and protected classes are hashed with `bcryptjs` (salt cost 10–12). Hashes are never returned in API payloads.
2. **Server-Side Validation**: All request bodies are strictly sanitized with `zod` schemas before touching database models.
3. **Endpoint Rate Limiting**:
   - `Login`: 5 attempts / 2 minutes per email.
   - `Forgot Password`: 3 requests / 10 minutes per IP.
   - `Class Password Unlock`: 5 attempts / 5 minutes per IP & class ID.
4. **RBAC Route Guards**: Next.js `middleware.ts` guards dashboard paths and creation routes, while API routes double-check session roles using `ROLE_HIERARCHY`.

---

##  Quick Start & Local Setup

### 1. Prerequisites
- Node.js 18+ (tested on Node v20/v26)
- PostgreSQL database (Neon, Vercel Postgres, Supabase, or local PostgreSQL instance)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your database URL and a secure NextAuth secret:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-at-least-32-characters"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Run Database Migrations
Push the schema to your PostgreSQL database:
```bash
npm run prisma:push
# or npx prisma db push
```

### 5. Seed Initial Accounts & Classes
Run the seed script:
```bash
npm run prisma:seed
# or npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

### 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
To view the standalone 3D landing page, visit [http://localhost:3000/landing.html](http://localhost:3000/landing.html).

---

##  Pre-Seeded Test Credentials

| Role | Email | Password | Details |
|---|---|---|---|
| **Super Admin** | `superadmin@aibootcamp.dev` | `CosmicMasterAdmin2026!` | Full RBAC permissions & role switcher |
| **Admin** | `admin@aibootcamp.dev` | `AstrologyAdmin2026!` | Class author & student manager |
| **Subscriber** | `subscriber@aibootcamp.dev` | `CosmicSubscriber2026!` | Mystic subscriber tier access |
| **User** | `user@aibootcamp.dev` | `CosmicUser2026!` | Standard seeker account |

*Note: On the login page ([/login](http://localhost:3000/login)), there are quick "Click to Fill" buttons for all 4 test roles for rapid testing.*

### Seeded Protected Class Password
- **Class**: Hermetic Astrology: The Secret Decanates & Fixed Stars
- **Access Key Password**: `starlight777`

---

##  Deployment on Vercel

### Official Production URL
👉 **[https://ai-bootcamp-lms-zeta.vercel.app](https://ai-bootcamp-lms-zeta.vercel.app)**

> **Important Deployment Constraint**:
> Always deploy to the dedicated Vercel project **`ai-bootcamp-lms`** (`prj_eeUC325GKlBlG5qNfFRTsNwXzt18`).
> **DO NOT** deploy, link, or alias to `miracle-star.vercel.app` (which is a separate/protected deployment).

### Fast Deployment Commands
```bash
# Production deploy (auto-targets ai-bootcamp-lms)
npm run deploy

# Preview deploy
npm run deploy:preview
```

Both parts are fully configured for Vercel deployment:

1. **Option A: Co-Deployment (Recommended)**
   - Push this repository to GitHub or GitLab.
   - Project is linked to Vercel project `ai-bootcamp-lms`.
   - In Project Settings -> Environment Variables, configure:
     - `DATABASE_URL` = `file:./dev.db` (SQLite, committed at `prisma/dev.db`)
     - `NEXTAUTH_SECRET` (generate using `openssl rand -base64 32`)
     - `NEXTAUTH_URL` (`https://ai-bootcamp-lms-zeta.vercel.app`)
     - `NEXT_PUBLIC_APP_URL` (`https://ai-bootcamp-lms-zeta.vercel.app`)
   - The landing page is automatically served from `/public/landing.html` (and also available at `/landing` via Next.js rewrite).
   - `public/landing/js/config.js` is pre-configured with `https://ai-bootcamp-lms-zeta.vercel.app`.

2. **Option B: Standalone Landing Page**
   - Deploy `public/landing.html` together with the `public/landing/` folder as a static site to any static CDN, GitHub Pages, or Vercel static project.
   - Set `APP_URL` in `landing/js/config.js` to `https://ai-bootcamp-lms-zeta.vercel.app`.

---

##  RBAC Permission Matrix

| Action | USER | SUBSCRIBER | ADMIN | SUPER_ADMIN |
|---|:---:|:---:|:---:|:---:|
| Browse Public Catalog | [x] | [x] | [x] | [x] |
| Enroll in Free Classes | [x] | [x] | [x] | [x] |
| Enter Secret Key to Unlock Classes | [x] | [x] | [x] (Bypass) | [x] (Bypass) |
| Access Subscriber Masterclasses | [ ] | [x] | [x] | [x] |
| Calculate & Edit Natal Profile | [x] | [x] | [x] | [x] |
| Access Seeker Dashboard (`/dashboard/user`) | [x] | [x] | [x] | [x] |
| Access Subscriber Dashboard (`/dashboard/subscriber`) | [ ] | [x] | [x] | [x] |
| Create & Edit Classes (`/classes/new`) | [ ] | [ ] | [x] | [x] |
| Delete Classes | [ ] | [ ] | [x] | [x] |
| Access Admin Dashboard (`/dashboard/admin`) | [ ] | [ ] | [x] | [x] |
| Assign or Revoke User Roles | [ ] | [ ] | [ ] | [x] |
| Modify Platform-Wide Settings | [ ] | [ ] | [ ] | [x] |
| Access Super Admin Dashboard (`/dashboard/super-admin`) | [ ] | [ ] | [ ] | [x] |
