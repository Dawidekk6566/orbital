"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useReducedMotion } from "framer-motion";

export function HeroBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000, active: false });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos((prev) => ({ ...prev, active: false }));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    el.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden"
    >
      {/* 1. Precision Technical Grid */}
      <div
        className="absolute inset-0 opacity-[0.4] dark:opacity-[0.25]"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--color-line) 1px, transparent 1px),
            linear-gradient(to bottom, var(--color-line) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          backgroundPosition: "center top",
        }}
      />

      {/* 2. Intersection Crosses (+) Pattern */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.35] dark:opacity-[0.22]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="hero-grid-crosses"
            width="64"
            height="64"
            patternUnits="userSpaceOnUse"
            patternTransform="translate(32, 0)"
          >
            <path
              d="M 32 28 L 32 36 M 28 32 L 36 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-gray-1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid-crosses)" />
      </svg>

      {/* 3. Interactive Cursor Spotlight */}
      {mousePos.active && !reduce && (
        <div
          className="transition-opacity duration-300"
          style={{
            position: "absolute",
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            width: "560px",
            height: "560px",
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(10,10,10,0.06) 0%, rgba(10,10,10,0.02) 40%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />
      )}

      {/* 4. Ambient Animated Diagnostic Scan Beam (subtle vertical sweep) */}
      {!reduce && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-ink/25 to-transparent animate-[scan_10s_ease-in-out_infinite] opacity-60" />
      )}

      {/* 5. Focal Center Atmospheric Glow */}
      <div className="absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2 h-[500px] w-[900px] rounded-full bg-[radial-gradient(ellipse,rgba(10,10,10,0.03),transparent_70%)] dark:bg-[radial-gradient(ellipse,rgba(255,255,255,0.04),transparent_70%)] blur-3xl" />

      {/* 6. Vignette Masks (ensure pristine contrast for text and smooth transition to next section) */}
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-void via-void/80 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-void via-void/50 to-transparent" />
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-void via-void/30 to-transparent max-md:hidden" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-void via-void/30 to-transparent max-md:hidden" />
    </div>
  );
}
