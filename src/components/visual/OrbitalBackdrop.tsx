"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/* ============================================================
   OrbitalBackdrop — klient-only opakowanie sceny 3D. Ładuje
   OrbitalScene leniwie (next/dynamic, ssr:false), żeby three.js nie
   trafił do bundla serwera ani krytycznej ścieżki renderu. Pauzuje
   render poza ekranem (IntersectionObserver) i wyłącza animację przy
   prefers-reduced-motion. Dekoracyjne → aria-hidden, pointer-events
   none (parallax i tak czyta globalny kursor).
   ============================================================ */

const OrbitalScene = dynamic(() => import("./OrbitalScene"), { ssr: false });

export function OrbitalBackdrop({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      {inView ? <OrbitalScene active={!reduce && inView} /> : null}
    </div>
  );
}
