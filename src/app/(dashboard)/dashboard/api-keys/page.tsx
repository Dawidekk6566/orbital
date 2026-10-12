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
   API (/dashboard/api-keys) — manage REST API keys and show how to
   call the public API. The API is a paid-plan feature; free teams
   see an upgrade prompt. Keys are owner/admin-managed.
   ============================================================ */

export default async function ApiKeysPage() {
  const team = await getCurrentTeam();

  if (!team) {
    return (
      <div>
        <h1 className="text-[clamp(22px,3vw,30px)] font-semibold tracking-[-0.025em]">
          API
        </h1>
        <p className="mt-8 rounded-[10px] border border-dashed border-line bg-bg-soft p-12 text-center text-[14px] text-gray-1">
          No active team. Sign in to manage API keys.
        </p>
      </div>
    );
  }

  const apiAvailable = limitsFor(team.plan).api;
  const canManage = team.role === "owner" || team.role === "admin";
  const keys = apiAvailable ? await listApiKeys(team.id) : [];
  const appUrl = process.env.APP_URL ?? "https://your-app.example.com";

  return (
    <div>
      <header>
        <h1 className="text-[clamp(22px,3vw,30px)] font-semibold tracking-[-0.025em]">
          API
        </h1>
        <p className="mt-1 text-[13px] text-gray-1">
          Run audits from CI or your own tools with the Orbital REST API.
        </p>
      </header>

      {!apiAvailable ? (
        <div className="mt-8 rounded-[10px] border border-dashed border-line bg-bg-soft p-8 text-center">
          <p className="text-[14px] text-ink">
            The REST API is included on Pro and Team.
          </p>
          <p className="mt-1 text-[13px] text-gray-1">
            You&rsquo;re on the {PLAN_LABELS[team.plan]} plan.
          </p>
          <Link
            href="/dashboard/billing"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#222]"
          >
            Upgrade
          </Link>
        </div>
      ) : (
        <>
          <section className="mt-8">
            <ApiKeyManager keys={keys} canManage={canManage} />
          </section>

          <section className="mt-12">
            <h2 className="text-[12px] uppercase tracking-[0.06em] text-muted">
              Terminal CLI (npx)
            </h2>
            <p className="mt-2 text-[13px] text-gray-1">
              Audit any site instantly from your terminal, npm scripts, or pre-commit hooks:
            </p>
            <pre className="mt-3 overflow-x-auto rounded-[10px] border border-line bg-white p-4 font-mono text-[12.5px] leading-[1.6] text-ink-2">
              {`# Audit and fail build if score < 85
npx orbital-audit https://your-site.com --fail-under 85

# Export markdown report
npx orbital-audit https://your-site.com --format markdown --output audit-report.md`}
            </pre>
          </section>

          <section className="mt-10">
            <h2 className="text-[12px] uppercase tracking-[0.06em] text-muted">
              REST API Quick start
            </h2>
            <p className="mt-2 text-[13px] text-gray-1">
              Authenticate with your API key to run and persist audits:
            </p>
            <pre className="mt-3 overflow-x-auto rounded-[10px] border border-line bg-white p-4 font-mono text-[12.5px] leading-[1.6] text-ink-2">
              {`curl -X POST ${appUrl}/api/v1/audits \\
  -H "Authorization: Bearer $ORBITAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`}
            </pre>
            <p className="mt-4 text-[13px] text-gray-1">List your projects:</p>
            <pre className="mt-3 overflow-x-auto rounded-[10px] border border-line bg-white p-4 font-mono text-[12.5px] leading-[1.6] text-ink-2">
              {`curl ${appUrl}/api/v1/projects \\
  -H "Authorization: Bearer $ORBITAL_API_KEY"`}
            </pre>
          </section>

          <section className="mt-10">
            <h2 className="text-[12px] uppercase tracking-[0.06em] text-muted">
              GitHub Actions &amp; Quality Gate
            </h2>
            <p className="mt-2 text-[13px] text-gray-1">
              Drop this in{" "}
              <code className="font-mono text-[12.5px] text-ink">
                .github/workflows/orbital-audit.yml
              </code>{" "}
              to enforce quality on every Pull Request:
            </p>
            <pre className="mt-3 overflow-x-auto rounded-[10px] border border-line bg-white p-4 font-mono text-[12.5px] leading-[1.6] text-ink-2">
              {`name: Orbital Audit
on: [pull_request, push]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Orbital Site Audit
        run: npx orbital-audit "https://example.com" --fail-under 80`}
            </pre>
          </section>
        </>
      )}
    </div>
  );
}
