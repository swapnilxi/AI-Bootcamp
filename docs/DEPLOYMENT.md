# Vercel Deployment Guide — AI Bootcamp

This project is fully optimized and configured for seamless deployment on **Vercel**.

---

## 1. Prerequisites & Environment Variables

When deploying to Vercel (via GitHub integration or the Vercel CLI), configure the following environment variables in **Project Settings &rarr; Environment Variables**:

| Variable | Description | Example / Recommended Value |
|---|---|---|
| `DATABASE_URL` | SQLite file (committed at `prisma/dev.db`) | `file:./dev.db` |
| `NEXTAUTH_URL` | Canonical URL of your deployment | `https://your-domain.vercel.app` (or your custom domain) |
| `NEXTAUTH_SECRET` | 32+ character random string | Generate with: `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL`| Canonical frontend URL for links/OG | `https://your-domain.vercel.app` |
| `ANTHROPIC_API_KEY` | *(Optional)* Enables AI features (Claude) | Key from console.anthropic.com; unset hides AI features |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` | *(Optional)* Booking emails via any SMTP provider | e.g. Resend: `smtp.resend.com`, port `465` |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM` | *(Optional)* Automatic WhatsApp messages | Twilio WhatsApp sender number |
| `ADMIN_NOTIFY_EMAIL` | *(Optional)* Inbox for new-booking alerts | `bookings@your-domain.com` |
| `PRACTICE_TIMEZONE` / `DEFAULT_COUNTRY_CODE` | Booking timezone and default phone country code | `Asia/Kolkata`, `91` |
| `CRON_SECRET` | Protects the daily reminder job (`vercel.json` cron) | `openssl rand -hex 32` |
| `INITIAL_SUPER_ADMIN_EMAIL` | *(Optional)* Initial admin email | `superadmin@aibootcamp.dev` |
| `INITIAL_SUPER_ADMIN_PASSWORD` | *(Optional)* Initial admin pass | Strong production password |

> **SQLite on Vercel:** `prisma/dev.db` is committed and bundled with the functions. Vercel's filesystem is read-only, so on cold start the app copies it to `/tmp`. Reads work fully; writes (bookings, registrations) succeed but are **ephemeral** per serverless instance. For durable production writes, move to a hosted DB (e.g. Turso/Neon).

---

## 2. Automated Build Pipeline

The project includes built-in hooks in `package.json` for Vercel's build lifecycle:
- **`postinstall`**: Runs `prisma generate` immediately upon dependency installation.
- **`build`**: Runs `prisma generate && next build` to guarantee client bindings and build all 33 static and dynamic routes.
- **`vercel.json`**: Explicitly targets the Next.js framework preset.

---

## 3. Database Migration / Schema Push

Before your first deployment, create/refresh the committed SQLite database:

```bash
DATABASE_URL="file:./dev.db" npx prisma db push

# (Optional) Seed initial services, classes, and admin user
DATABASE_URL="file:./dev.db" npm run prisma:seed

# Then commit prisma/dev.db
```

---

## 4. Deploying via Vercel CLI

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Link and deploy
vercel
```

Or simply push your repository to **GitHub / GitLab / Bitbucket** and import the project in the [Vercel Dashboard](https://vercel.com/new).

---

## 5. Verification Checklist

- [x] Next.js 15 App Router with full static generation (SSG/ISR)
- [x] Zero build errors (`npm run build` passes with exit code 0)
- [x] Zero ESLint errors (`npm run lint` passes with exit code 0)
- [x] `src/app/not-found.tsx` custom 404 page configured
- [x] OpenGraph `metadataBase` configured in root layout
- [x] Edge Runtime safe middleware (no Node-only native modules in `middleware.ts`)
- [x] Serverless-safe Prisma client singleton in `src/lib/prisma.ts`
- [x] Public static assets and `public/landing.html` available at root


---

## Booking notifications

- **Email** goes through SMTP (`nodemailer`), so any provider works. Without SMTP settings, messages are logged as *skipped* (and printed to the console in development).
- **WhatsApp** is sent automatically through Twilio when the `TWILIO_*` variables are set. Note: WhatsApp only allows business-initiated messages to use pre-approved templates outside a 24-hour conversation window, so register templates in Twilio for production use. Without Twilio, every booking in the admin dashboard has a one-click **Open WhatsApp chat** button with the message pre-filled.
- **Reminders** are sent by `/api/cron/reminders`, scheduled daily in `vercel.json` (Vercel Hobby plans run crons once a day). It reminds every confirmed booking starting within the next 36 hours, once.
