"use client";

/* ============================================================
   (dashboard) error boundary — catches render/data errors in any
   dashboard segment. Client Component (required for error.tsx).
   Offers a retry via reset(). Keeps the monochrome shell voice.
   ============================================================ */

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-[10px] border border-line bg-white p-10 text-center">
      <h2 className="text-[18px] font-semibold tracking-[-0.01em]">
        Something went wrong
      </h2>
      <p className="mx-auto mt-2 max-w-[46ch] text-[14px] text-gray-1">
        We couldn&apos;t load this page. This is often temporary — try again.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-[12px] text-faint">ref: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="mt-5 inline-flex items-center justify-center rounded-full bg-ink px-5 py-[11px] text-[15px] font-medium text-white transition-colors duration-[180ms] hover:bg-[#222]"
      >
        Try again
      </button>
    </div>
  );
}
