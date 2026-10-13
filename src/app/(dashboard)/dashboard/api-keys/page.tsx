import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentTeam } from "@/lib/auth/dal";
import { listApiKeys } from "@/lib/dashboard/queries";
import { limitsFor, PLAN_LABELS } from "@/lib/plans";
import { ApiKeyManager } from "@/components/dashboard/team/ApiKeyManager";

export const metadata: Metadata = {
  title: "API — Orbital",
};

/* ============================================================
   API (/dashboard/api-keys) — Programmatic access workbench.
   Manage REST API credentials, Terminal CLI (npx) integration,
   and GitHub Actions Quality Gate automation.
   ============================================================ */

export default async function ApiKeysPage() {
  const team = await getCurrentTeam();

  if (!team) {
    return (
      <div className="flex flex-col gap-8">
        <header className="border-b border-line pb-6">
          <h1 className="text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.025em] text-ink">
            API Keys
          </h1>
        </header>
        <p className="rounded-[10px] border border-dashed border-line bg-bg-soft/60 p-12 text-center text-[14px] text-gray-1 font-mono">
          No active team found. Sign in to manage API tokens.
        </p>
      </div>
    );
  }

  const apiAvailable = limitsFor(team.plan).api;
  const canManage = team.role === "owner" || team.role === "admin";
  const keys = apiAvailable ? await listApiKeys(team.id) : [];
  const appUrl = process.env.APP_URL ?? "https://your-app.example.com";

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Header with Telemetry Status */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
            <span className="font-mono text-[12px] uppercase tracking-wider text-muted">
              Programmatic Access / REST &amp; CLI Tokens
            </span>
          </div>
          <h1 className="mt-1 text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.025em] text-ink">
            API &amp; Developer Tools
          </h1>
          <p className="mt-1 text-[14.5px] text-gray-1">
            Generate scoped API tokens to trigger audits from CI pipelines, terminal scripts, or custom microservices.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-line bg-bg-soft px-3 py-1 font-mono text-[11.5px] text-gray-1">
          <span className="h-1.5 w-1.5 rounded-full bg-good" />
          <span>Endpoint: v1 REST &amp; Webhooks</span>
          <span className="text-line-strong">·</span>
          <span className="text-muted">{PLAN_LABELS[team.plan]} Tier</span>
        </div>
      </div>

      {/* 2. High-Density Telemetry Metric Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Active Tokens</span>
            <span className="font-mono text-[10.5px] text-gray-1">
              {apiAvailable ? `${keys.length} keys` : "Locked"}
            </span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            {apiAvailable ? keys.length : "0"}
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>Bearer authentication</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Terminal CLI</span>
            <span className="font-mono text-[10.5px] text-gray-1">npm</span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            npx ready
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>orbital-audit v2.4</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>CI Quality Gate</span>
            <span className="rounded border border-line px-1.5 py-0.5 text-[10px] text-gray-1">
              Actions
            </span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            PR Gate
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>Fail on regressions</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Rate Allowance</span>
            <span className="font-mono text-[10.5px] text-gray-1">Limits</span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            60 req/min
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>High-concurrency workers</span>
          </div>
        </div>
      </div>

      {!apiAvailable ? (
        <div className="rounded-[10px] border border-line bg-white/95 p-8 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5 text-center">
          <span className="font-mono text-[12px] text-muted uppercase">Pro &amp; Team Feature</span>
          <h2 className="mt-2 text-[18px] font-semibold text-ink">
            Programmatic REST API &amp; CI/CD tokens are available on Pro and Team
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] text-gray-1">
            Upgrade your plan to generate API keys, trigger audits from pre-commit hooks, and enforce quality gates on GitHub Actions.
          </p>
          <Link
            href="/dashboard/billing"
            className="mt-5 inline-block rounded bg-ink px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Upgrade to Pro →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* 3. API Key Manager Workbench */}
          <section className="rounded-[10px] border border-line bg-white/95 p-6 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5">
            <div className="mb-4 border-b border-line pb-3">
              <h2 className="text-[16px] font-semibold text-ink">
                Active Secret Keys
              </h2>
              <p className="text-[13px] text-muted">
                Keep your secret API keys secure. Tokens carry full audit dispatch privileges for this team.
              </p>
            </div>
            <ApiKeyManager keys={keys} canManage={canManage} />
          </section>

          {/* 4. Developer Integration Guides (CLI, REST, GitHub Actions) */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Terminal CLI */}
            <section className="rounded-[10px] border border-line bg-white/95 p-5 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                Terminal CLI Tool
              </span>
              <h3 className="mt-1 text-[15px] font-semibold text-ink">
                One-liner Audit via npx
              </h3>
              <p className="mt-1 text-[12.5px] text-gray-1">
                Audit any target URL directly from your local terminal or npm build scripts:
              </p>
              <pre className="mt-3 overflow-x-auto rounded-[6px] border border-line bg-bg-soft/70 p-3.5 font-mono text-[12px] leading-[1.6] text-ink">
{`# Fail build if score < 85
npx orbital-audit https://your-site.com --fail-under 85

# Export structured markdown report
npx orbital-audit https://your-site.com --format markdown -o report.md`}
              </pre>
            </section>

            {/* REST API */}
            <section className="rounded-[10px] border border-line bg-white/95 p-5 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                REST API Endpoint
              </span>
              <h3 className="mt-1 text-[15px] font-semibold text-ink">
                Direct HTTP Execution
              </h3>
              <p className="mt-1 text-[12.5px] text-gray-1">
                Trigger audits asynchronously with standard cURL or Axios HTTP requests:
              </p>
              <pre className="mt-3 overflow-x-auto rounded-[6px] border border-line bg-bg-soft/70 p-3.5 font-mono text-[12px] leading-[1.6] text-ink">
{`curl -X POST ${appUrl}/api/v1/audits \\
  -H "Authorization: Bearer $ORBITAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`}
              </pre>
            </section>
          </div>

          {/* GitHub Actions Quality Gate */}
          <section className="rounded-[10px] border border-line bg-white/95 p-5 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
              CI/CD Automation
            </span>
            <h3 className="mt-1 text-[15px] font-semibold text-ink">
              GitHub Actions PR Quality Gate
            </h3>
            <p className="mt-1 text-[13px] text-gray-1">
              Add this workflow to enforce Core Web Vitals and security standards on every Pull Request:
            </p>
            <pre className="mt-3 overflow-x-auto rounded-[6px] border border-line bg-bg-soft/70 p-3.5 font-mono text-[12px] leading-[1.6] text-ink">
{`name: Orbital Quality Gate
on: [pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Orbital Site Audit
        run: npx orbital-audit "https://staging.yourdomain.com" --fail-under 85`}
            </pre>
          </section>
        </div>
      )}
    </div>
  );
}
