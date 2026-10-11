"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

/* ============================================================
   Footer globalny — ukrywany na trasach pełnoekranowych bez
   scrolla (np. /pricing), gdzie stopka rozbiłaby układ 1-widok.
   ============================================================ */

const NO_FOOTER = new Set(["/pricing"]);

export function ConditionalFooter() {
  const pathname = usePathname();
  if (NO_FOOTER.has(pathname)) return null;
  return <Footer />;
}
