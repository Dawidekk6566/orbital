"use client";

import { Starfield } from "./Starfield";

/* ============================================================
   SpaceBackground — globalne, kosmiczne tło całej aplikacji.
   Przyklejone na stałe (fixed) pod całą treścią (-z-10): głęboka
   czerń + delikatna poświata „mgławicy" + ruszające się gwiazdy
   (Starfield). Treść stron ma przezroczyste tła, więc gwiazdy widać
   za wszystkim. Dekoracyjne i nieinteraktywne. Montowane raz w root
   layoucie — jedna instancja silnika cząsteczek na całą witrynę.
   ============================================================ */

export function SpaceBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-void transition-colors duration-300"
    >
      {/* miękkie poświaty dla głębi (bardzo subtelne) */}
      <div className="absolute left-1/2 top-[-10%] h-[60vmax] w-[60vmax] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.035),transparent_60%)] dark:bg-[radial-gradient(circle,rgba(120,130,160,0.10),transparent_60%)] blur-2xl transition-all duration-300" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[48vmax] w-[48vmax] rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.025),transparent_62%)] dark:bg-[radial-gradient(circle,rgba(90,100,140,0.08),transparent_62%)] blur-2xl transition-all duration-300" />
      {/* ruchome gwiazdy */}
      <Starfield className="absolute inset-0" count={130} />
    </div>
  );
}
