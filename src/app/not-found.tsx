import Link from "next/link";

/* ============================================================
   Root not-found — the 404 for unknown routes and for pages that
   call notFound() (a bad /share token, a foreign audit id). Renders
   inside the root layout; keeps the monochrome Orbital voice with a
   single way back home.
   ============================================================ */

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col items-center justify-center px-6 text-center">
      <span
        className="relative mb-6 block h-5 w-5 rounded-full border-[1.6px] border-ink after:absolute after:left-1/2 after:top-[2px] after:-ml-[2px] after:h-1 after:w-1 after:rounded-full after:bg-ink after:content-['']"
        aria-hidden="true"
      />
      <p className="font-mono text-[13px] uppercase tracking-[0.08em] text-muted">
        404
      </p>
      <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em]">
        This page is out of orbit
      </h1>
      <p className="mt-2 text-[15px] text-gray-1">
        The page you&apos;re looking for doesn&apos;t exist, or the link has
        expired.
      </p>
      <Link
        href="/"
        className="mt-7 inline-flex items-center justify-center rounded-full bg-ink px-5 py-[11px] text-[15px] font-medium text-white transition-colors duration-[180ms] hover:bg-[#222]"
      >
        Back to home
      </Link>
    </main>
  );
}
