import type { Metadata } from "next";
import Script from "next/script";
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
  title: "Orbital — Technical Website Audits, 0–100 Scoring",
  description:
    "Submit a URL, files, code or screenshot and receive an in-depth audit of performance, SEO, accessibility, and security.",
  keywords: [
    "website audit",
    "performance analysis",
    "SEO",
    "accessibility",
    "Core Web Vitals",
    "Lighthouse",
  ],
  openGraph: {
    title: "Orbital",
    description:
      "Technical website analyzer for developers — performance, SEO, accessibility, and security.",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
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

import { ThemeProvider } from "@/components/theme/ThemeProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pl"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <head>
        <Script
          id="orbital-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("orbital-theme");if(t==="light"||(!t&&window.matchMedia("(prefers-color-scheme: light)").matches)){document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light";}else{document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="relative flex min-h-full w-full max-w-full flex-col overflow-x-clip bg-transparent text-star">
        <ThemeProvider>
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
