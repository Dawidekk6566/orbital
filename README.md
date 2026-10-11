# Orbital

Advanced website audit platform. Point it at any public URL and it scores the
page across **Performance, SEO, Accessibility and Security**, then turns the
findings into a prioritized, fix-ready report — every check has a plain-English
explanation and the failing ones come with copy-paste before/after code.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 and
Supabase. Deploys to Vercel.

> The marketing site and the guest audit work with **zero configuration** —
> with no API keys the analyzer serves realistic demo data and the account
> area stays gated. Add keys to unlock real audits, accounts and billing.

## Features

- **Guest audit** — audit a URL from the landing page, no signup required.
- **Multi-dimension engine** — Lighthouse metrics (PageSpeed), HTML rule
  checks, real-world field vitals (CrUX), security headers + live TLS
  inspection, and Wappalyzer-style tech-stack detection.
- **AI recommendations** — optional Claude-generated fixes layered on top.
- **Accounts & dashboard** — projects, audit history, scheduled re-audits,
  alerts, side-by-side compare/versus, shareable report links, team invites.
- **Billing** — Stripe subscriptions (Pro / Team).
- **Public REST API** — `/api/v1/*` for programmatic audits.
- **Cosmic UI** — three.js + particle backdrops, honoring `prefers-reduced-motion`.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions) |
| UI | React 19, Tailwind CSS v4, framer-motion, three.js, tsParticles |
| Auth & DB | Supabase (Postgres + RLS, SSR cookies) |
| Billing | Stripe |
| Background jobs | Upstash QStash (scheduled re-audits) |
| AI | Anthropic SDK (`@anthropic-ai/sdk`) |

## Getting started

### 1. Prerequisites

- Node.js 20+
- A Supabase project (for auth / dashboard; optional for guest demo)

### 2. Install

```bash
npm install
```

### 3. Environment

```bash
cp .env.example .env.local
```

Fill in the values you have. Everything is optional for the guest demo; see
[Environment variables](#environment-variables) for what each key unlocks.

### 4. Database (Supabase)

Apply the SQL migrations in `supabase/migrations/` (in order) to your project —
via the Supabase SQL editor or the Supabase CLI — then optionally run
`supabase/seed.sql` for sample data.

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (what Vercel runs) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## How analysis works

The engine degrades gracefully based on which keys are present:

1. **URL mode** runs PageSpeed (Lighthouse), CrUX field data, an SSRF-guarded
   HTTP/TLS inspection, security-header and tech-stack analyzers in parallel.
2. If `PAGESPEED_API_KEY` is absent, it falls back to HTML rule checks.
3. If nothing can run, it returns demo data so the UI is always populated.
4. `ANTHROPIC_API_KEY`, when set, adds AI-written recommendations on top.

Report content (descriptions + fix code) lives in a UI-side catalog
(`src/lib/analysis/checkDocs.ts`) keyed by stable check id, so reports stay
small and catalog improvements apply to historical audits retroactively.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel — the framework preset is detected automatically
   (build `next build`, output handled by Vercel). No `vercel.json` needed.
3. Add the environment variables below in **Project → Settings → Environment
   Variables**.
4. Deploy.

### Environment variables

| Variable | Required for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Accounts | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Accounts | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Accounts | **Server-only secret** |
| `APP_URL` | OAuth / Stripe / QStash | Your deployed origin, e.g. `https://orbital.vercel.app` |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Server Actions | Set a stable value so encrypted actions survive across Vercel's multiple instances (`openssl rand -base64 32`) |
| `PAGESPEED_API_KEY` | Real audits | Without it → HTML rules / demo |
| `CRUX_API_KEY` | Field vitals | Falls back to `PAGESPEED_API_KEY` |
| `ANTHROPIC_API_KEY` | AI fixes | Optional |
| `ANALYSIS_MODEL` | AI fixes | Optional override (default `claude-sonnet-5-5`) |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_TEAM` | Billing | |
| `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` | Scheduled re-audits | |

After deploying, set each provider's redirect/callback and webhook URLs to your
`APP_URL` (Supabase OAuth → `/auth/callback`, Stripe webhook → `/api/stripe/webhook`).

## Project structure

```
src/
  app/            # routes: (marketing) (auth) (dashboard) api share auth
  components/     # UI — landing, dashboard, auth, visual (3D), layout
  lib/            # analysis engine, supabase, billing, queue, dashboard data
  i18n/           # lightweight context-based i18n (PL default)
supabase/
  migrations/     # ordered SQL schema (apply in order)
  seed.sql        # optional sample data
```

## Notes

- Real headless-browser audits (screenshots, network waterfall, axe-core) are
  planned via a **separate** render worker (own deployable with Chromium) — not
  part of this Next.js app, which Vercel hosts on its own.
