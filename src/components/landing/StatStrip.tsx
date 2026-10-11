import { Reveal } from "./Reveal";

/* Układ: 2 kolumny do 1000px, 4 kolumny powyżej. Długie słowa
   („Accessibility") potrzebują szerszych kolumn, więc 4-kolumnowy
   wariant włącza się dopiero, gdy jest na nie miejsce. `min-w-0`
   pozwala siatce zwężać komórki (bez tego długie słowo wylewa się
   na sąsiada), a `break-words` to ostatni bezpiecznik przed nachodzeniem.
   Linie podziału dodawane są wyłącznie przyrostowo (bez nadpisań
   zależnych od kolejności klas), by uniknąć niestabilnego RWD. */
const STAT_CLASS =
  "min-w-0 px-[clamp(16px,4vw,22px)] py-[22px] " +
  "min-[1000px]:px-[clamp(18px,2.4vw,36px)] min-[1000px]:py-0 " +
  // 2 kolumny: pionowa linia przy prawej kolumnie, górna linia w 2. rzędzie
  "[&:nth-child(even)]:border-l [&:nth-child(even)]:border-line " +
  "[&:nth-child(n+3)]:border-t [&:nth-child(n+3)]:border-line " +
  // 4 kolumny: dołóż pionową linię 3. komórce, usuń górne linie
  "min-[1000px]:[&:nth-child(3)]:border-l min-[1000px]:[&:nth-child(3)]:border-line " +
  "min-[1000px]:[&:nth-child(n+3)]:border-t-0";

const NUM_CLASS =
  "font-mono text-[clamp(16px,2vw,22px)] font-semibold leading-[1.15] tracking-[-0.01em] break-words";
const LABEL_CLASS = "mt-2.5 text-[13.5px] leading-[1.5] text-gray-1";

/* Cztery wymiary, które audyt faktycznie bada — bez zmyślonych
   liczników. Treść odpowiada realnym analizatorom silnika:
   CrUX (crux.ts), TLS/nagłówki (security.ts, httpInspect.ts),
   reguły SEO/a11y (htmlRules.ts) + Core Web Vitals. */
const DIMENSIONS = [
  { name: "Performance", desc: "Core Web Vitals, lab metrics & CrUX field data" },
  { name: "SEO", desc: "Metadata, crawlability & structured data" },
  { name: "Accessibility", desc: "WCAG checks: contrast, ARIA & labels" },
  { name: "Security", desc: "HTTPS, TLS certificate & security headers" },
] as const;

export function StatStrip() {
  return (
    <section className="border-y border-line bg-bg-soft">
      <div className="mx-auto max-w-[1200px] px-[clamp(24px,5vw,40px)] py-[clamp(36px,4.6vw,58px)]">
        <Reveal className="grid grid-cols-2 min-[1000px]:grid-cols-4">
          {DIMENSIONS.map((d) => (
            <div key={d.name} className={STAT_CLASS}>
              <div className={NUM_CLASS}>{d.name}</div>
              <div className={LABEL_CLASS}>{d.desc}</div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
