"use client";

import { useEffect, useState } from "react";

/* ============================================================
   Czyta aktualne kolory motywu (tokeny @theme z globals.css) jako
   konkretne wartości hex — potrzebne, bo materiały three.js nie
   rozumieją zmiennych CSS. Reaguje na zmianę motywu (klasa `dark`
   na <html>, przełączana przez ThemeToggle), więc scena 3D flipuje
   razem z resztą UI. Monochrom: `ink` jest widoczny w obu motywach.
   ============================================================ */

export interface ThemeColors {
  ink: string;
  muted: string;
  faint: string;
  void: string;
}

const FALLBACK: ThemeColors = {
  ink: "#0a0a0a",
  muted: "#888888",
  faint: "#b0b0b0",
  void: "#ffffff",
};

function read(): ThemeColors {
  if (typeof window === "undefined") return FALLBACK;
  const s = getComputedStyle(document.documentElement);
  const get = (name: string, fb: string) => s.getPropertyValue(name).trim() || fb;
  return {
    ink: get("--color-ink", FALLBACK.ink),
    muted: get("--color-muted", FALLBACK.muted),
    faint: get("--color-faint", FALLBACK.faint),
    void: get("--color-void", FALLBACK.void),
  };
}

export function useThemeColors(): ThemeColors {
  // Lazy init czyta tokeny od razu przy pierwszym renderze (komponent
  // jest montowany tylko po stronie klienta — scena 3D ma ssr:false),
  // więc nie wołamy setState synchronicznie w efekcie.
  const [colors, setColors] = useState<ThemeColors>(read);

  useEffect(() => {
    // Przeładuj kolory, gdy zmieni się klasa motywu na <html>
    // (subskrypcja zewnętrznego źródła — setState w callbacku jest OK).
    const observer = new MutationObserver(() => setColors(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}
