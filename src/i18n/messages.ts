/* ============================================================
   Dwujęzyczne treści interfejsu (PL / EN).
   Lekki, w pełni otypowany słownik — bez zależności od routingu.
   ============================================================ */

export const LOCALES = ["pl", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const messages = {
  pl: {
    nav: {
      features: "Funkcje",
      demo: "Demo",
      how: "Jak to działa",
      faq: "FAQ",
      cta: "Analizuj stronę",
    },
    hero: {
      badge: "Analiza strony napędzana AI",
      title: "Zbadaj swoją stronę",
      titleAccent: "na poziomie orbity",
      subtitle:
        "Prześlij adres, pliki, kod lub zrzut ekranu. Orbital Audit prześwietli wydajność, SEO, dostępność oraz bezpieczeństwo i wskaże, co dokładnie poprawić.",
      scrollHint: "Przewiń, aby odkryć więcej",
    },
    analyzer: {
      tabs: {
        url: "URL",
        files: "Pliki",
        code: "Kod",
        screenshot: "Zrzut ekranu",
      },
      urlPlaceholder: "https://twoja-strona.pl",
      urlLabel: "Adres strony do analizy",
      codePlaceholder: "Wklej tutaj kod HTML / CSS / JS…",
      codeLabel: "Kod do analizy",
      filesLabel: "Przeciągnij pliki lub kliknij, aby wybrać",
      filesHint: "HTML, CSS, JS lub ZIP — maks. 30 plików",
      screenshotLabel: "Przeciągnij zrzut ekranu lub kliknij",
      screenshotHint: "PNG, JPG lub WebP — maks. 5 MB",
      screenshotNotes: "Dodatkowy kontekst (opcjonalnie)",
      submit: "Rozpocznij analizę",
      analyzing: "Analizuję…",
      demoButton: "Zobacz przykładowy raport",
      errorGeneric: "Coś poszło nie tak. Spróbuj ponownie.",
      errorUrl: "Podaj poprawny, publiczny adres URL (http/https).",
      errorEmpty: "Najpierw dodaj dane do analizy.",
      fileTooLarge: "Plik jest zbyt duży.",
    },
    loader: {
      messages: [
        "Kalibruję skaner orbitalny…",
        "Pobieram sygnały ze strony…",
        "Mierzę Core Web Vitals…",
        "Sprawdzam dostępność i kontrast…",
        "Skanuję pod kątem podatności…",
        "Formułuję rekomendacje…",
      ],
    },
    features: {
      title: "Cztery wektory analizy",
      subtitle: "Kompleksowy audyt w jednym przelocie nad Twoją stroną.",
      items: {
        performance: {
          title: "Wydajność",
          desc: "Core Web Vitals, czas ładowania, rozmiar zasobów i optymalizacja obrazów.",
        },
        seo: {
          title: "SEO",
          desc: "Meta tagi, struktura nagłówków, dane strukturalne i indeksowalność.",
        },
        accessibility: {
          title: "Dostępność",
          desc: "Kontrast, ARIA, nawigacja klawiaturą i zgodność z WCAG.",
        },
        security: {
          title: "Kod i bezpieczeństwo",
          desc: "Jakość kodu, nagłówki bezpieczeństwa, podatności i przestarzałe wzorce.",
        },
      },
    },
    demo: {
      title: "Tak wygląda raport",
      subtitle: "Interaktywny dashboard z wynikami, wykresami i priorytetami napraw.",
      cta: "Przeanalizuj własną stronę",
    },
    how: {
      title: "Jak to działa",
      steps: [
        { title: "Prześlij stronę", desc: "Podaj URL, wgraj pliki, wklej kod lub zrzut ekranu." },
        { title: "Skanowanie orbitalne", desc: "Silnik łączy Lighthouse, reguły i model AI." },
        { title: "Wyniki i wykresy", desc: "Otrzymujesz score'y 0–100 oraz animowany dashboard." },
        { title: "Popraw i powtórz", desc: "Wdrażaj priorytetowe zalecenia i analizuj ponownie." },
      ],
    },
    faq: {
      title: "Najczęstsze pytania",
      items: [
        {
          q: "Czy moje dane są bezpieczne?",
          a: "Klucze API pozostają wyłącznie po stronie serwera. Adresy URL pobieramy z zabezpieczeniem przed SSRF, a przesłany kod nie jest trwale przechowywany.",
        },
        {
          q: "Czy potrzebuję kluczy API?",
          a: "Nie do przetestowania. Bez konfiguracji aplikacja działa w trybie demo z danymi przykładowymi. Klucze odblokowują realną analizę.",
        },
        {
          q: "Jakie formaty plików obsługujecie?",
          a: "Pliki HTML, CSS i JS oraz archiwa ZIP z projektem. Zrzuty ekranu w PNG, JPG lub WebP.",
        },
        {
          q: "Na czym opiera się analiza?",
          a: "Na Google PageSpeed Insights (Lighthouse) dla trybu URL oraz na regułach i modelu AI dla kodu i zrzutów ekranu.",
        },
      ],
    },
    footer: {
      tagline: "Orbital Audit — kosmiczny analizator stron dla developerów.",
      rights: "Wszelkie prawa zastrzeżone.",
      madeWith: "Zbudowane z pasją do dostępnego, szybkiego internetu.",
      product: "Produkt",
      resources: "Zasoby",
    },
    dashboard: {
      overall: "Wynik ogólny",
      reAnalyze: "Analizuj ponownie",
      export: "Eksportuj raport",
      copied: "Skopiowano!",
      recommendations: "Rekomendacje",
      metrics: "Metryki",
      comparison: "Porównanie obszarów",
      demoBanner: "Tryb demo — dane przykładowe. Skonfiguruj klucze API, aby uzyskać realną analizę.",
      analyzedAt: "Przeanalizowano",
      noRecommendations: "Brak istotnych rekomendacji — świetna robota!",
    },
    categories: {
      performance: "Wydajność",
      seo: "SEO",
      accessibility: "Dostępność",
      security: "Bezpieczeństwo",
    },
    severity: {
      critical: "Krytyczne",
      high: "Wysokie",
      medium: "Średnie",
      low: "Drobne",
    },
    common: {
      backToTop: "Do góry",
      language: "Język",
      close: "Zamknij",
      saveToAccount: "Zapisz na koncie",
    },
  },
  en: {
    nav: {
      features: "Features",
      demo: "Demo",
      how: "How it works",
      faq: "FAQ",
      cta: "Analyze site",
    },
    hero: {
      badge: "AI-powered site analysis",
      title: "Audit your site",
      titleAccent: "from orbit",
      subtitle:
        "Drop a URL, files, code or a screenshot. Orbital Audit x-rays performance, SEO, accessibility and security — and tells you exactly what to fix.",
      scrollHint: "Scroll to explore",
    },
    analyzer: {
      tabs: {
        url: "URL",
        files: "Files",
        code: "Code",
        screenshot: "Screenshot",
      },
      urlPlaceholder: "https://your-site.com",
      urlLabel: "Website URL to analyze",
      codePlaceholder: "Paste your HTML / CSS / JS here…",
      codeLabel: "Code to analyze",
      filesLabel: "Drag files here or click to browse",
      filesHint: "HTML, CSS, JS or ZIP — up to 30 files",
      screenshotLabel: "Drag a screenshot here or click",
      screenshotHint: "PNG, JPG or WebP — max 5 MB",
      screenshotNotes: "Extra context (optional)",
      submit: "Start analysis",
      analyzing: "Analyzing…",
      demoButton: "See a sample report",
      errorGeneric: "Something went wrong. Please try again.",
      errorUrl: "Enter a valid, public URL (http/https).",
      errorEmpty: "Add something to analyze first.",
      fileTooLarge: "File is too large.",
    },
    loader: {
      messages: [
        "Calibrating orbital scanner…",
        "Fetching site signals…",
        "Measuring Core Web Vitals…",
        "Checking accessibility & contrast…",
        "Scanning for vulnerabilities…",
        "Composing recommendations…",
      ],
    },
    features: {
      title: "Four vectors of analysis",
      subtitle: "A complete audit in a single pass over your site.",
      items: {
        performance: {
          title: "Performance",
          desc: "Core Web Vitals, load time, asset weight and image optimization.",
        },
        seo: {
          title: "SEO",
          desc: "Meta tags, heading structure, structured data and indexability.",
        },
        accessibility: {
          title: "Accessibility",
          desc: "Contrast, ARIA, keyboard navigation and WCAG compliance.",
        },
        security: {
          title: "Code & security",
          desc: "Code quality, security headers, vulnerabilities and legacy patterns.",
        },
      },
    },
    demo: {
      title: "This is your report",
      subtitle: "An interactive dashboard with scores, charts and fix priorities.",
      cta: "Analyze your own site",
    },
    how: {
      title: "How it works",
      steps: [
        { title: "Submit your site", desc: "Provide a URL, upload files, paste code or a screenshot." },
        { title: "Orbital scan", desc: "The engine blends Lighthouse, rules and an AI model." },
        { title: "Scores & charts", desc: "You get 0–100 scores and an animated dashboard." },
        { title: "Fix & repeat", desc: "Ship the priority fixes and re-run the analysis." },
      ],
    },
    faq: {
      title: "Frequently asked questions",
      items: [
        {
          q: "Is my data safe?",
          a: "API keys stay strictly server-side. URLs are fetched with SSRF protection and submitted code is not stored permanently.",
        },
        {
          q: "Do I need API keys?",
          a: "Not to try it. Without configuration the app runs in demo mode with sample data. Keys unlock real analysis.",
        },
        {
          q: "Which file formats are supported?",
          a: "HTML, CSS and JS files plus ZIP project archives. Screenshots as PNG, JPG or WebP.",
        },
        {
          q: "What powers the analysis?",
          a: "Google PageSpeed Insights (Lighthouse) for URL mode, plus rules and an AI model for code and screenshots.",
        },
      ],
    },
    footer: {
      tagline: "Orbital Audit — a cosmic site analyzer for developers.",
      rights: "All rights reserved.",
      madeWith: "Built with a passion for a fast, accessible web.",
      product: "Product",
      resources: "Resources",
    },
    dashboard: {
      overall: "Overall score",
      reAnalyze: "Analyze again",
      export: "Export report",
      copied: "Copied!",
      recommendations: "Recommendations",
      metrics: "Metrics",
      comparison: "Category comparison",
      demoBanner: "Demo mode — sample data. Configure API keys for real analysis.",
      analyzedAt: "Analyzed",
      noRecommendations: "No significant recommendations — great work!",
    },
    categories: {
      performance: "Performance",
      seo: "SEO",
      accessibility: "Accessibility",
      security: "Security",
    },
    severity: {
      critical: "Critical",
      high: "High",
      medium: "Medium",
      low: "Low",
    },
    common: {
      backToTop: "Back to top",
      language: "Language",
      close: "Close",
      saveToAccount: "Save to my account",
    },
  },
} as const;

export type Messages = (typeof messages)["pl"];
