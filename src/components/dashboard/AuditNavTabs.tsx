"use client";

import { useEffect, useRef, useState } from "react";

export interface NavSection {
  id: string;
  label: string;
}

interface SectionCategory {
  title: string;
  ids: string[];
}

const CATEGORIES: SectionCategory[] = [
  {
    title: "Overview & Core",
    ids: ["overview", "vitals", "opportunities"],
  },
  {
    title: "Performance & Network",
    ids: ["performance", "network", "budget", "thirdparty", "dom"],
  },
  {
    title: "Core Audits",
    ids: ["accessibility", "seo", "security"],
  },
  {
    title: "Security & Domain",
    ids: ["headers", "dns", "cve", "csp", "techstack"],
  },
  {
    title: "SEO & Discovery",
    ids: ["social", "schema", "crawler"],
  },
  {
    title: "Runtime Diagnostics",
    ids: ["console"],
  },
];

export function AuditNavTabs({
  sections,
  activeSec,
  onSelect,
}: {
  sections: NavSection[];
  activeSec: string;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Sprawdzanie czy kontener ma przestrzeń do przewijania
  const updateScrollState = () => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setHasOverflow(scrollWidth > clientWidth + 4);
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  };

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [sections.length]);

  // Obsługa kółka myszy nad paskiem zakładek (poziome przewijanie)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0 && el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollBy({ left: e.deltaY * 1.1, behavior: "auto" });
        updateScrollState();
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  // Automatyczne wyśrodkowanie aktywnego taba w widoku paska
  useEffect(() => {
    const tabEl = tabRefs.current.get(activeSec);
    const container = containerRef.current;
    if (tabEl && container) {
      const tabLeft = tabEl.offsetLeft;
      const tabWidth = tabEl.offsetWidth;
      const containerWidth = container.offsetWidth;
      const targetScroll = tabLeft - containerWidth / 2 + tabWidth / 2;
      container.scrollTo({ left: targetScroll, behavior: "smooth" });
      setTimeout(updateScrollState, 300);
    }
  }, [activeSec]);

  // Zamykanie dropdowna po kliknięciu poza lub Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  const scrollBy = (offset: number) => {
    containerRef.current?.scrollBy({ left: offset, behavior: "smooth" });
    setTimeout(updateScrollState, 250);
  };

  const handleTabClick = (id: string) => {
    onSelect(id);
    setDropdownOpen(false);
  };

  return (
    <div className="relative border-t border-line">
      <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between px-3 sm:px-6">
        {/* Lewy przycisk przewijania - flex-none, poza kontenerem zakładek */}
        {hasOverflow && (
          <button
            type="button"
            onClick={() => scrollBy(-240)}
            disabled={!canScrollLeft}
            aria-label="Scroll tabs left"
            className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm transition-all hover:border-ink hover:bg-bg-soft active:scale-95 disabled:pointer-events-none disabled:opacity-20 dark:bg-[#16171a]"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}

        {/* Pasek poziomych zakładek - ograniczony ściśle pomiędzy przyciskami */}
        <div
          ref={containerRef}
          onScroll={updateScrollState}
          className="mx-2 flex flex-1 min-w-0 items-center gap-1 overflow-x-auto py-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {sections.map((s) => {
            const isActive = activeSec === s.id;
            return (
              <button
                key={s.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(s.id, el);
                  else tabRefs.current.delete(s.id);
                }}
                onClick={() => handleTabClick(s.id)}
                className={`whitespace-nowrap border-b-2 px-3 py-3.5 text-[13px] font-medium transition-[color,border-color] duration-150 flex-none ${
                  isActive
                    ? "border-ink text-ink font-semibold"
                    : "border-transparent text-gray-1 hover:text-ink"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Prawy przycisk przewijania - flex-none, poza kontenerem zakładek */}
        {hasOverflow && (
          <button
            type="button"
            onClick={() => scrollBy(240)}
            disabled={!canScrollRight}
            aria-label="Scroll tabs right"
            className="mr-2 flex h-7 w-7 flex-none items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm transition-all hover:border-ink hover:bg-bg-soft active:scale-95 disabled:pointer-events-none disabled:opacity-20 dark:bg-[#16171a]"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        )}

        {/* Rozwijany selektor wszystkich sekcji (Quick jump menu) */}
        <div ref={dropdownRef} className="relative ml-2 flex-none py-2">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            aria-label="All audit sections"
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11.5px] font-medium transition-all ${
              dropdownOpen
                ? "border-ink bg-ink text-white"
                : "border-line bg-white text-gray-1 hover:border-ink hover:text-ink dark:bg-[#16171a]"
            }`}
          >
            <svg className="h-3.5 w-3.5 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
            <span className="hidden sm:inline">Sections ({sections.length})</span>
            <span className="sm:hidden">All</span>
            <svg
              className={`h-3 w-3 flex-none transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {/* Okno rozwijane z pogrupowanymi sekcjami */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-[320px] sm:w-[440px] rounded-[10px] border border-line bg-white p-4 shadow-xl backdrop-blur-xl dark:bg-[#16171a]">
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <span className="font-mono text-[12px] font-semibold text-ink">
                  Jump to report section
                </span>
                <span className="font-mono text-[11px] text-muted">
                  {sections.length} sections
                </span>
              </div>

              <div className="mt-3 max-h-[360px] space-y-3.5 overflow-y-auto pr-1">
                {CATEGORIES.map((cat) => {
                  const matchingSections = sections.filter((s) => cat.ids.includes(s.id));
                  if (matchingSections.length === 0) return null;

                  return (
                    <div key={cat.title}>
                      <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">
                        {cat.title}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {matchingSections.map((s) => {
                          const isActive = activeSec === s.id;
                          return (
                            <button
                              key={s.id}
                              onClick={() => handleTabClick(s.id)}
                              className={`rounded-full px-2.5 py-1 text-[12px] transition-colors ${
                                isActive
                                  ? "bg-ink font-semibold text-white"
                                  : "bg-bg-soft text-gray-1 hover:bg-line hover:text-ink"
                              }`}
                            >
                              {s.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Sekcje, które nie wpadły do żadnej zdefiniowanej kategorii */}
                {(() => {
                  const categorizedIds = new Set(CATEGORIES.flatMap((c) => c.ids));
                  const uncategorized = sections.filter((s) => !categorizedIds.has(s.id));
                  if (uncategorized.length === 0) return null;

                  return (
                    <div>
                      <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">
                        Other sections
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {uncategorized.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => handleTabClick(s.id)}
                            className={`rounded-full px-2.5 py-1 text-[12px] transition-colors ${
                              activeSec === s.id
                                ? "bg-ink font-semibold text-white"
                                : "bg-bg-soft text-gray-1 hover:bg-line hover:text-ink"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
