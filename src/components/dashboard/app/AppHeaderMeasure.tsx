"use client";

import { useEffect, useRef } from "react";

/* ============================================================
   Publishes the dashboard header's live height as the CSS custom
   property `--app-header-h` on <html>. The header is two rows
   (brand bar + TopNavTabs) and wraps on narrow viewports, so its
   height is dynamic. The embedded ResultsDashboard reads this var
   to pin its own sticky sub-header right below the chrome instead
   of guessing a fixed offset (which left it hidden underneath).
   ============================================================ */
export function AppHeaderMeasure() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const header = ref.current?.closest("header");
    if (!header) return;
    const root = document.documentElement;
    const apply = () =>
      root.style.setProperty(
        "--app-header-h",
        `${Math.round(header.getBoundingClientRect().height)}px`,
      );
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(header);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--app-header-h");
    };
  }, []);

  return <span ref={ref} aria-hidden="true" className="hidden" />;
}
