"use client";

import { useMemo } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useReducedMotion } from "framer-motion";
import type { Engine, ISourceOptions } from "@tsparticles/engine";

/* ============================================================
   Starfield — subtelne „gwiazdy" tsparticles pod ciemnymi sekcjami
   (CtaBand). Niska gęstość, powolny dryf, biała barwa na czerni —
   spójne z motywem „Orbital". Dekoracyjne (aria-hidden, bez
   interakcji). prefers-reduced-motion → statyczne punkty bez ruchu.

   API @tsparticles/react v4: silnik inicjuje <ParticlesProvider init>
   (callback MUSI być stabilny — stąd stała na poziomie modułu); dzieci
   montują się dopiero po załadowaniu silnika (slim bundle).
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

  const options = useMemo<ISourceOptions>(
    () => ({
      fullScreen: { enable: false },
      fpsLimit: 60,
      detectRetina: true,
      particles: {
        number: { value: count ?? (reduce ? 36 : 68) },
        color: { value: "#ffffff" },
        opacity: {
          value: { min: 0.06, max: 0.42 },
          animation: { enable: !reduce, speed: 0.5, sync: false, startValue: "random" },
        },
        size: { value: { min: 0.4, max: 1.6 } },
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
    [reduce, count],
  );

  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      <ParticlesProvider init={initEngine}>
        <Particles id="orbital-starfield" options={options} className="h-full w-full" />
      </ParticlesProvider>
    </div>
  );
}
