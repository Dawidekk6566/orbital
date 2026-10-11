<!-- Marketing README. Replace the placeholder links (your-domain.com) with the live Vercel/custom-domain URL after deploy. -->

<div align="center">

<img src="docs/media/hero.jpg" alt="Orbital — know exactly why your site is slow, and what to fix first" width="100%" />

<h1>Orbital</h1>

### Mission control for your website's health.

**Orbital audits any URL in seconds and tells you exactly what to fix first** — scored across Performance, SEO, Accessibility and Security, with every issue explained in plain English and copy-paste code to fix it.

<p>
  <a href="https://your-domain.com"><img src="https://img.shields.io/badge/▶_Visit_Orbital-0B0B0E?style=for-the-badge" alt="Visit Orbital" /></a>
  <a href="https://your-domain.com/#report"><img src="https://img.shields.io/badge/Run_a_live_audit-1F2937?style=for-the-badge" alt="Live demo" /></a>
  <a href="https://your-domain.com/pricing"><img src="https://img.shields.io/badge/Pricing-1F2937?style=for-the-badge" alt="Pricing" /></a>
</p>

<sub>Built with</sub><br/>
<img src="https://img.shields.io/badge/Next.js-000?logo=next.js&logoColor=white" />
<img src="https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind_CSS-0B1120?logo=tailwindcss&logoColor=38BDF8" />
<img src="https://img.shields.io/badge/Supabase-181818?logo=supabase&logoColor=3ECF8E" />

</div>

---

## A score tells you where you stand. Orbital tells you what to do next.

Most tools hand you a number and a wall of two hundred warnings. Orbital hands you a **ranked plan**: the handful of fixes that actually move your score, each one explained, each one with the exact snippet to paste in.

No signup. No install. Paste a URL, get a full report in seconds.

<div align="center">
  <img src="docs/media/report-overview.jpg" alt="Orbital audit report — overall score and category breakdown" width="90%" />
</div>

<!-- TODO: drop in a short GIF of a live audit running (loader → report) here when you have a screen recording. -->

## Not just *what's* wrong — the exact fix

Every check expands into a full explanation: what it checks, what it found on your page, why it matters, and a **before / after code block you can copy straight into your project.** Even passing checks tell you what you're doing right.

<div align="center">
  <img src="docs/media/report-fix.jpg" alt="A check expanded to show the problem and a copy-paste before/after code fix" width="90%" />
</div>

## Everything you get

| | |
|---|---|
| 🎯 **One honest number** | A 0–100 score across Performance, SEO, Accessibility and Security — plus the breakdown behind it. |
| 🧭 **A ranked fix list** | Issues ordered by the points each fix returns, not severity noise. No 200-warning dumps. |
| 💻 **Copy-paste fixes** | Real before/after code for every finding — paste it and move on. |
| ⚡ **Real Core Web Vitals** | Lab metrics plus real-world field data (CrUX) from actual Chrome users. |
| 🔒 **Security & TLS** | Live certificate inspection, security-header checks and HTTPS validation. |
| 🧱 **Tech-stack detection** | See the frameworks, CDNs and analytics a site runs on. |
| 📈 **Track over time** | Every run saved — watch scores climb and catch regressions. |
| ⚔️ **Benchmark competitors** | Audit any rival URL and compare side by side. |
| ⏱️ **Scheduled audits & alerts** | Re-audit on a schedule; get pinged when a score drops. |
| 👥 **Teams, API & sharing** | Team seats, a public REST API, and shareable report links. |

## Watch your scores climb

Orbital saves every run, so you can see progress over time and catch regressions the moment they land — complete with per-category deltas.

<div align="center">
  <img src="docs/media/project-history.jpg" alt="Project run history with score deltas over time" width="90%" />
</div>

<!-- TODO: a GIF scrolling through a report or expanding checks works great here. -->

## Beat your competition

Point Orbital at a competitor's URL and compare runs side by side — what you fixed, what regressed, and where you still trail, across every category.

<div align="center">
  <img src="docs/media/compare.jpg" alt="Side-by-side comparison of two audit runs with category radar and diff" width="90%" />
</div>

## A home base for your whole team

Projects, history, scheduled re-audits, alerts, billing and an API — all in one calm, fast dashboard.

<div align="center">
  <img src="docs/media/dashboard.jpg" alt="Orbital dashboard — projects and scores at a glance" width="90%" />
</div>

## Try it in one click — no signup

Paste a URL on the landing page and watch the real pipeline run. The guest audit uses the exact same engine as paid plans.

<div align="center">
  <img src="docs/media/live-demo.jpg" alt="Run an audit right from the landing page" width="78%" />
  &nbsp;
  <img src="docs/media/mobile-hero.jpg" alt="Orbital on mobile" width="18%" />
</div>

<div align="right"><sub>Looks great on every screen ↑</sub></div>

## Simple, honest pricing

Every plan runs the **same** 40+ checks — you pay for history, automation and seats, never for a better score.

| | Free | Pro | Team |
|---|---|---|---|
| **Price** | $0 forever | $29 / mo | $99 / mo |
| Audits / month | 25 | 2,000 | Unlimited |
| URLs tracked | 1 | 25 | Unlimited |
| Run history | 7 days | 1 year | Unlimited |
| Scheduled re-audits | — | Daily | Hourly |
| Team seats | 1 | 3 | Unlimited |
| Slack & webhook alerts | — | ✓ | ✓ |
| Public REST API | — | ✓ | ✓ |

<div align="center">
  <img src="docs/media/pricing.jpg" alt="Orbital pricing — Free, Pro and Team plans" width="90%" />
</div>

## Get started

<div align="center">

### Audit your site in the next 10 seconds — free, no signup.

<a href="https://your-domain.com"><img src="https://img.shields.io/badge/▶_Audit_my_site-0B0B0E?style=for-the-badge" alt="Audit my site" /></a>

</div>

---

<details>
<summary><b>Running Orbital yourself (developers)</b></summary>

<br/>

Orbital is a Next.js 16 app. It runs with **zero config** — with no API keys the guest audit serves realistic demo data; add keys to unlock real audits, accounts and billing.

```bash
npm install
cp .env.example .env.local   # fill in the keys you have (all optional for the demo)
npm run dev                  # http://localhost:3000
```

Accounts and the dashboard are backed by Supabase — apply the SQL in `supabase/migrations/` (in order). Deploys to Vercel out of the box; set the environment variables from `.env.example` in your project settings. See the comments in `.env.example` for what each key unlocks.

</details>

<div align="center"><sub>Orbital — mission control for your website's health.</sub></div>



