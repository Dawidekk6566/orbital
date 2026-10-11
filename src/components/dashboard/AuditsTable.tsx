import Link from "next/link";
import type { AuditListRow } from "@/lib/dashboard/queries";
import { scoreTone, TONE_TEXT, timeAgo } from "@/lib/dashboard/score";

/* ============================================================
   AuditsTable — run history for a project. Rows are newest-first
   (as returned by the query); the "Δ" column compares each row's
   overall score to the next-older run so regressions/gains read at
   a glance (text-good up, text-bad down). Each row links to the
   embedded report. Shared by the project detail and history pages.
   ============================================================ */

function Delta({ curr, prev }: { curr: number | null; prev: number | null }) {
  if (curr == null || prev == null) return <span className="text-faint">—</span>;
  const d = curr - prev;
  if (d === 0) return <span className="text-muted">0</span>;
  const up = d > 0;
  return (
    <span className={up ? "text-good" : "text-bad"}>
      {up ? "▲" : "▼"} {Math.abs(d)}
    </span>
  );
}

export function AuditsTable({
  audits,
  showCompare = false,
}: {
  audits: AuditListRow[];
  /** Adds a "vs prev" link per row comparing it to the next-older run. */
  showCompare?: boolean;
}) {
  if (audits.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-line bg-bg-soft p-10 text-center">
        <p className="text-[14px] text-gray-1">
          No audits in the retained window. Run an audit to see scores here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[10px] border border-line">
      <table className="w-full border-collapse text-[14px]">
        <thead>
          <tr className="border-b border-line bg-bg-soft text-left text-[12px] uppercase tracking-[0.06em] text-muted">
            <th className="px-4 py-2.5 font-medium">When</th>
            <th className="px-4 py-2.5 font-medium">Overall</th>
            <th className="px-4 py-2.5 font-medium">Δ</th>
            <th className="px-4 py-2.5 font-medium">Perf</th>
            <th className="px-4 py-2.5 font-medium">SEO</th>
            <th className="px-4 py-2.5 font-medium">A11y</th>
            <th className="px-4 py-2.5 font-medium">Security</th>
            <th className="px-4 py-2.5 font-medium">Engine</th>
            {showCompare ? <th className="px-4 py-2.5 font-medium">Compare</th> : null}
          </tr>
        </thead>
        <tbody>
          {audits.map((a, i) => (
            <tr
              key={a.id}
              className="border-b border-line last:border-0 hover:bg-bg-soft"
            >
              <td className="px-4 py-2.5">
                <Link
                  href={`/dashboard/audits/${a.id}`}
                  className="text-ink underline underline-offset-2"
                >
                  {timeAgo(a.created_at)}
                </Link>
              </td>
              <td
                className={`px-4 py-2.5 font-mono ${TONE_TEXT[scoreTone(a.overall_score)]}`}
              >
                {a.overall_score ?? "—"}
              </td>
              <td className="px-4 py-2.5 font-mono text-[13px]">
                <Delta
                  curr={a.overall_score}
                  prev={audits[i + 1]?.overall_score ?? null}
                />
              </td>
              <td className="px-4 py-2.5 font-mono text-gray-1">
                {a.perf_score ?? "—"}
              </td>
              <td className="px-4 py-2.5 font-mono text-gray-1">
                {a.seo_score ?? "—"}
              </td>
              <td className="px-4 py-2.5 font-mono text-gray-1">
                {a.a11y_score ?? "—"}
              </td>
              <td className="px-4 py-2.5 font-mono text-gray-1">
                {a.security_score ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-[12px] text-faint">
                {a.is_demo ? "demo" : (a.engine ?? "—")}
              </td>
              {showCompare ? (
                <td className="px-4 py-2.5 text-[13px]">
                  {audits[i + 1] ? (
                    <Link
                      href={`/dashboard/compare?base=${audits[i + 1].id}&target=${a.id}`}
                      className="text-gray-1 underline underline-offset-2 hover:text-ink"
                    >
                      vs prev
                    </Link>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
