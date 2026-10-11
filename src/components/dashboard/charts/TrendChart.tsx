"use client";

import { useState } from "react";

/* ============================================================
   TrendChart — hand-rolled inline SVG line chart of audit scores
   over time. Client Component: a metric toggle (Overall / Perf /
   SEO / A11y / Security) swaps which series is drawn; per-point
   <title> gives a native hover tooltip. Strict monochrome — ink
   polyline, --color-line grid, mono ticks, no fills. Expects the
   series in chronological order (oldest → newest).
   ============================================================ */

export type TrendPoint = {
  date: string; // ISO
  overall: number | null;
  perf: number | null;
  seo: number | null;
  a11y: number | null;
  security: number | null;
};

type MetricKey = "overall" | "perf" | "seo" | "a11y" | "security";

const METRICS: { key: MetricKey; label: string }[] = [
  { key: "overall", label: "Overall" },
  { key: "perf", label: "Perf" },
  { key: "seo", label: "SEO" },
  { key: "a11y", label: "A11y" },
  { key: "security", label: "Security" },
];

const W = 560;
const H = 220;
const PAD = { top: 14, right: 14, bottom: 26, left: 30 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const Y_TICKS = [0, 25, 50, 75, 100];

const fmtDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC", // deterministic across server/client — avoids hydration drift
});

export function TrendChart({ points }: { points: TrendPoint[] }) {
  const [metric, setMetric] = useState<MetricKey>("overall");

  const x = (i: number) =>
    points.length <= 1
      ? PAD.left + PLOT_W / 2
      : PAD.left + (i / (points.length - 1)) * PLOT_W;
  const y = (v: number) => PAD.top + (1 - v / 100) * PLOT_H;

  const series = points.map((p, i) => ({
    i,
    date: p.date,
    value: p[metric],
  }));
  const drawn = series.filter((s) => s.value != null) as {
    i: number;
    date: string;
    value: number;
  }[];

  const line = drawn.map((s) => `${x(s.i)},${y(s.value)}`).join(" ");

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMetric(m.key)}
            aria-pressed={metric === m.key}
            className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
              metric === m.key
                ? "border-ink bg-ink text-white"
                : "border-line text-gray-1 hover:border-ink hover:text-ink"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${METRICS.find((m) => m.key === metric)?.label} score over ${points.length} audits`}
      >
        {/* horizontal grid + y ticks */}
        {Y_TICKS.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              y1={y(t)}
              x2={W - PAD.right}
              y2={y(t)}
              stroke="var(--color-line)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={y(t)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-faint font-mono text-[9px]"
            >
              {t}
            </text>
          </g>
        ))}

        {/* x date labels: first, middle, last (when enough points) */}
        {points.map((p, i) => {
          const show =
            points.length <= 1 ||
            i === 0 ||
            i === points.length - 1 ||
            (points.length > 4 && i === Math.floor((points.length - 1) / 2));
          if (!show) return null;
          const anchor =
            i === 0 ? "start" : i === points.length - 1 ? "end" : "middle";
          return (
            <text
              key={p.date}
              x={x(i)}
              y={H - 8}
              textAnchor={anchor}
              className="fill-muted font-mono text-[9px]"
            >
              {fmtDate.format(new Date(p.date))}
            </text>
          );
        })}

        {/* line */}
        {drawn.length > 1 && (
          <polyline
            points={line}
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* points */}
        {drawn.map((s) => (
          <circle
            key={s.i}
            cx={x(s.i)}
            cy={y(s.value)}
            r={3}
            fill="var(--color-ink)"
          >
            <title>{`${fmtDate.format(new Date(s.date))}: ${s.value}`}</title>
          </circle>
        ))}

        {/* single-point value label */}
        {drawn.length === 1 && (
          <text
            x={x(drawn[0].i)}
            y={y(drawn[0].value) - 10}
            textAnchor="middle"
            className="fill-ink font-mono text-[11px] font-semibold"
          >
            {drawn[0].value}
          </text>
        )}
      </svg>

      {drawn.length === 0 && (
        <p className="mt-2 text-center text-[13px] text-muted">
          No data for this metric in the retained window.
        </p>
      )}
    </div>
  );
}
