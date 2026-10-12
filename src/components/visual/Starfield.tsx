"use client";

import { useMemo, useEffect, useState } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useReducedMotion } from "framer-motion";
import type { Engine, ISourceOptions } from "@tsparticles/engine";
import { useTheme } from "@/components/theme/ThemeProvider";

/* ============================================================
   Starfield — subtelne „gwiazdy" tsparticles pod całą aplikacją
   i ciemnymi sekcjami. Niska gęstość, powolny dryf.
   - Dark Mode: biała barwa na głębokiej czerni (#ffffff)
   - Light Mode: delikatny kosmiczny pył (#0a0a0a) na białym tle
   ============================================================ */

const initEngine = async (engine: Engine) => {
  await loadSlim(engine);
};

export function Starfield({
  className = "",
  count,
}: {
  className?: string;
  count?: number;
}) {
  const reduce = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  const options = useMemo<ISourceOptions>(
    () => ({
      fullScreen: { enable: false },
      fpsLimit: 60,
      detectRetina: true,
      particles: {
        number: { value: count ?? (reduce ? 36 : 68) },
        color: { value: isDark ? "#ffffff" : "#0a0a0a" },
        opacity: {
          value: isDark ? { min: 0.08, max: 0.45 } : { min: 0.04, max: 0.22 },
          animation: { enable: !reduce, speed: 0.5, sync: false, startValue: "random" },
        },
        size: { value: isDark ? { min: 0.4, max: 1.6 } : { min: 0.5, max: 1.8 } },
        move: {
          enable: !reduce,
          speed: 0.25,
          direction: "none",
          random: true,
          straight: false,
          outModes: { default: "out" },
        },
        links: { enable: false },
      },
      interactivity: {
        events: { onHover: { enable: false }, onClick: { enable: false }, resize: { enable: true } },
      },
    }),
    [reduce, count, isDark],
  );

  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      <ParticlesProvider init={initEngine}>
        <Particles
          key={isDark ? "dark" : "light"}
          id={`orbital-starfield-${isDark ? "dark" : "light"}`}
          options={options}
          className="h-full w-full"
        />
      </ParticlesProvider>
    </div>
  );
}
