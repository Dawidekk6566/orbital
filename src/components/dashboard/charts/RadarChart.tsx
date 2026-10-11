import { scoreTone, TONE_TEXT } from "@/lib/dashboard/score";

/* ============================================================
   RadarChart — hand-rolled inline SVG. Four category axes
   (Perf / SEO / A11y / Security) laid out from the top clockwise.
   Strict monochrome: current run is an ink polygon, the previous
   run (if any) is a faint overlay so regressions read at a glance.
   No fills, hairline grid rings in --color-line — matches the
   Orbital system. Pure component, safe on the server.
   ============================================================ */

export type RadarAxis = { label: string; score: number | null };

const R = 68; // radius at score = 100
const CX = 150;
const CY = 112;
const LABEL_R = 88; // labels sit outside the outer ring (uncapped, unlike scores)
const RINGS = [25, 50, 75, 100];

/** Point on an axis: index `i` of `n`, at `value` (0–100). Top = first axis. */
function pointFor(i: number, n: number, value: number): [number, number] {
  const angle = -Math.PI / 2 + (i / n) * 2 * Math.PI;
  const r = (Math.max(0, Math.min(100, value)) / 100) * R;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
}

/** Label anchor point on an axis, beyond the outer ring (not clamped). */
function labelPoint(i: number, n: number): [number, number] {
  const angle = -Math.PI / 2 + (i / n) * 2 * Math.PI;
  return [CX + LABEL_R * Math.cos(angle), CY + LABEL_R * Math.sin(angle)];
}

function polygon(values: number[]): string {
  return values
    .map((v, i) => pointFor(i, values.length, v).join(","))
    .join(" ");
}

export function RadarChart({
  current,
  previous,
}: {
  current: RadarAxis[];
  previous?: RadarAxis[];
}) {
  const n = current.length;
  const curVals = current.map((a) => a.score ?? 0);
  const prevVals = previous?.map((a) => a.score ?? 0);

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 300 232"
        className="h-auto w-full max-w-[340px]"
        role="img"
        aria-label={`Category radar: ${current
          .map((a) => `${a.label} ${a.score ?? "n/a"}`)
          .join(", ")}`}
      >
        {/* grid rings */}
        {RINGS.map((ring) => (
          <polygon
            key={ring}
            points={polygon(current.map(() => ring))}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth={1}
          />
        ))}

        {/* axis spokes + labels */}
        {current.map((axis, i) => {
          const [ex, ey] = pointFor(i, n, 100);
          const [lx, ly] = labelPoint(i, n);
          const cos = Math.cos(-Math.PI / 2 + (i / n) * 2 * Math.PI);
          const anchor = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
          const tone = scoreTone(axis.score);
          return (
            <g key={axis.label}>
              <line
                x1={CX}
                y1={CY}
                x2={ex}
                y2={ey}
                stroke="var(--color-line)"
                strokeWidth={1}
              />
              <text
                x={lx}
                y={ly}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="fill-muted font-mono text-[9px] uppercase tracking-[0.06em]"
              >
                {axis.label}
              </text>
              <text
                x={lx}
                y={ly + 11}
                textAnchor={anchor}
                dominantBaseline="middle"
                className={`${TONE_TEXT[tone]} font-mono text-[10px] font-semibold`}
                style={{ fill: "currentColor" }}
              >
                {axis.score ?? "—"}
              </text>
            </g>
          );
        })}

        {/* previous run overlay */}
        {prevVals && (
          <polygon
            points={polygon(prevVals)}
            fill="none"
            stroke="var(--color-faint)"
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
        )}

        {/* current run */}
        <polygon
          points={polygon(curVals)}
          fill="var(--color-ink)"
          fillOpacity={0.05}
          stroke="var(--color-ink)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {curVals.map((v, i) => {
          const [x, y] = pointFor(i, n, v);
          return <circle key={i} cx={x} cy={y} r={2.5} fill="var(--color-ink)" />;
        })}
      </svg>

      {previous && (
        <div className="mt-2 flex items-center gap-4 text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-[2px] w-4 bg-ink" /> This run
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-[2px] w-4 bg-faint" /> Previous
          </span>
        </div>
      )}
    </div>
  );
}
