import { Hero } from "@/components/landing/Hero";
import { LogoCloud } from "@/components/landing/LogoCloud";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { FeatureTrio } from "@/components/landing/FeatureTrio";
import { DeepDive } from "@/components/landing/DeepDive";
import { ChecksExplorer } from "@/components/landing/ChecksExplorer";
import { Simulator } from "@/components/landing/Simulator";
import { StatStrip } from "@/components/landing/StatStrip";
import { Integrations } from "@/components/landing/Integrations";
import { Pricing } from "@/components/landing/Pricing";
import { Faq } from "@/components/landing/Faq";

/* ============================================================
   Strona główna (single-page landing) — 1:1 z orbital-landing.html.
   Kolejność sekcji zgodna z <main> w pliku źródłowym.
   Wyniki analizy pojawiają się w nakładce (AnalysisOutlet).
   ============================================================ */

export default function Home() {
  return (
    <>
      <Hero />
      <LogoCloud />
      <LiveDemo />
      <FeatureTrio />
      <DeepDive />
      <ChecksExplorer />
      <Simulator />
      <StatStrip />
      <Integrations />
      <Pricing />
      <Faq />
    </>
  );
}
