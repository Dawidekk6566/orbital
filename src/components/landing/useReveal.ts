"use client";

import { useEffect, useRef, useState } from "react";

/* ============================================================
   Hook odtwarzający zachowanie IntersectionObserver z landingu:
   dodaje stan „in" gdy element wejdzie w widok. Reduced-motion
   → natychmiast widoczny.
   ============================================================ */

export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // Mount-time read of a browser media query (unavailable during SSR);
      // setting state here is the hydration-safe way to reveal immediately.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, inView };
}
