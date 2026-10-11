import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/i18n/provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Orbital — audyty techniczne stron, ocena 0–100",
  description:
    "Prześlij URL, pliki, kod lub zrzut ekranu i otrzymaj dogłębną analizę wydajności, SEO, dostępności oraz bezpieczeństwa Twojej strony.",
  keywords: [
    "audyt strony",
    "analiza wydajności",
    "SEO",
    "dostępność",
    "Core Web Vitals",
    "Lighthouse",
  ],
  openGraph: {
    title: "Orbital",
    description:
      "Techniczny analizator stron dla developerów — wydajność, SEO, dostępność i bezpieczeństwo.",
    type: "website",
  },
};

/* ============================================================
   Root layout (thin) — <html>/<body>, fonts and I18nProvider only.
   Marketing chrome (Navbar/Footer/guest modal) lives in the
   (marketing) route group; the dashboard and auth groups bring
   their own shells.

   Motyw „kosmiczny" jest jedynym motywem: klasa `dark` jest na <html>
   na stałe (SSR), więc nie ma FOUC ani jasnego wariantu. Tło zależy od
   grupy tras: landing i auth dostają gwiazdy (SpaceBackground), a
   dashboard spokojniejsze, statyczne tło (CalmBackground) — każda
   grupa montuje własne tło w swoim layoucie. Baza czerni jest na <html>.
   ============================================================ */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pl"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="relative flex min-h-full flex-col bg-transparent text-star">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
