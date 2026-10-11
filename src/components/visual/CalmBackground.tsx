/* ============================================================
   CalmBackground — spokojne, statyczne tło panelu użytkownika.
   Bez animacji i gwiazd: miękka, ciemna powierzchnia z delikatną
   poświatą u góry dla głębi. Komponent czysto-prezentacyjny (CSS),
   przyklejony pod treścią dashboardu. Odróżnia aplikację (skupienie)
   od marketingowego kosmosu (SpaceBackground).
   ============================================================ */

export function CalmBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 bg-[#0b0b0e]"
    >
      <div className="absolute inset-x-0 top-0 h-[40vh] bg-[radial-gradient(80%_100%_at_50%_0%,rgba(120,130,160,0.06),transparent_70%)]" />
    </div>
  );
}
