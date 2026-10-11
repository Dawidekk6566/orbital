import { scoreTone, TONE_BG } from "@/lib/dashboard/score";

/* ============================================================
   QuotaMeter — a labelled usage bar (used / limit) with a hairline
   track. Unlimited plans (null limit) render an ∞ with no bar.
   Presentational; the caller passes real counts from the DAL.
   ============================================================ */

export function QuotaMeter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  const unlimited = limit === null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  // Colour the bar by how close to the cap we are (reuse score bands).
  const tone = unlimited ? "none" : scoreTone(100 - pct);

  return (
    <div className="rounded-[10px] border border-line bg-white p-6">
      <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
        {label}
      </span>
      <p className="mt-3 font-mono text-[22px] font-semibold tracking-[-0.01em]">
        {used}
        <span className="text-[15px] text-faint">
          {" / "}
          {unlimited ? "∞" : limit}
        </span>
      </p>
      {!unlimited ? (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-line">
          <div
            className={`h-full rounded-full ${TONE_BG[tone]}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
