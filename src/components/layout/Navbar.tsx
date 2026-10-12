"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAnalysisStore } from "@/lib/store";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

/* ============================================================
   Nawigacja landingu (.nav) — 1:1 z HTML. Klasa .scrolled po
   przewinięciu > 8px (solidne tło + hairline). „Dashboard" otwiera
   podgląd wyników na danych demo.
   ============================================================ */

export function Navbar({ isAuthed = false }: { isAuthed?: boolean }) {
  const loadDemo = useAnalysisStore((s) => s.loadDemo);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[60] border-b transition-[background-color,border-color] duration-[250ms] ${
        scrolled
          ? "border-line bg-white/[0.92]"
          : "border-transparent"
      }`}
      id="nav"
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-6 px-[clamp(24px,5vw,40px)]">
        <Link
          className="flex items-center gap-2.5 text-[18px] font-semibold tracking-[-0.02em]"
          href="/#top"
          aria-label="Orbital home"
        >
          <span
            className="relative block h-4 w-4 flex-none rounded-full border-[1.6px] border-ink after:absolute after:left-1/2 after:top-[1.5px] after:-ml-[1.7px] after:h-[3.4px] after:w-[3.4px] after:rounded-full after:bg-ink after:content-['']"
            aria-hidden="true"
          />
          Orbital
        </Link>
        <nav
          className="flex gap-[30px] text-[15px] text-gray-1 max-[920px]:hidden"
          aria-label="Primary"
        >
          <Link href="/#top" className="transition-colors hover:text-ink">
            Product
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-ink">
            Pricing
          </Link>
          <Link href="/#report" className="transition-colors hover:text-ink">
            Docs
          </Link>
          <Link
            href={isAuthed ? "/dashboard" : "/#report"}
            className="transition-colors hover:text-ink"
            onClick={(e) => {
              if (isAuthed) return;
              e.preventDefault();
              loadDemo();
            }}
          >
            Dashboard
          </Link>
        </nav>
        <div className="flex items-center gap-[14px]">
          <ThemeToggle />
          {isAuthed ? (
            <Link
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-ink px-5 py-[11px] text-[15px] font-medium text-white transition-colors duration-[180ms] hover:bg-[#222]"
              href="/dashboard"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                className="text-[15px] text-gray-1 transition-colors hover:text-ink max-[600px]:hidden"
                href="/login"
              >
                Sign in
              </Link>
              <Link
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-ink px-5 py-[11px] text-[15px] font-medium text-white transition-colors duration-[180ms] hover:bg-[#222]"
                href="/signup"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
