import {
  CATEGORY_KEYS,
  type CategoryKey,
  type CategoryResult,
  type Metric,
  type MetricStatus,
  type Recommendation,
  type Severity,
} from "./types";

/* ============================================================
   Statyczna analiza kodu oparta na regułach (bez zewnętrznych API).
   Każda kontrola ma stabilne id, etykietę oraz opis „co sprawdza i
   dlaczego to ważne". Kontrola zwraca metrykę (zdaną lub nie), a przy
   wykryciu problemu także rekomendację z instrukcją naprawy i karą
   punktową. Wynik jest później wzbogacany przez model AI (ai.ts).
   ============================================================ */

export interface Source {
  name: string;
  content: string;
}

export interface StaticResult {
  categories: CategoryResult[];
  recommendations: Recommendation[];
}

/** Kontekst współdzielony przez wszystkie kontrole. */
interface CheckContext {
  html: string;
  js: string;
  css: string;
  all: string;
  hasHtml: boolean;
}

/** Wynik pojedynczej kontroli; `finding` obecne tylko przy problemie. */
interface CheckOutcome {
  status: MetricStatus;
  /** Zwięzła wartość obok etykiety (np. „OK", „Brak", „3/7"). */
  value: string | number;
  finding?: { severity: Severity; problem: string; fix: string; penalty: number };
}

interface Check {
  id: string;
  category: CategoryKey;
  label: string;
  description: string;
  /** Zwraca wynik lub `null`, gdy kontrola nie dotyczy danego wejścia. */
  run: (ctx: CheckContext) => CheckOutcome | null;
}

function count(text: string, re: RegExp): number {
  return (text.match(re) ?? []).length;
}

/** Skrót: kontrola zdana. */
const ok = (value: string | number = "OK"): CheckOutcome => ({ status: "good", value });

/** Skrót: kontrola z problemem (status wynika z wagi). */
function fail(
  severity: Severity,
  value: string | number,
  problem: string,
  fix: string,
  penalty: number,
): CheckOutcome {
  return {
    status: severity === "critical" || severity === "high" ? "bad" : "warn",
    value,
    finding: { severity, problem, fix, penalty },
  };
}

const titleText = (html: string): string =>
  html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";

const CHECKS: Check[] = [
  // ---------- SEO ----------
  {
    id: "seo-title",
    category: "seo",
    label: "Znacznik <title>",
    description:
      "Tytuł to najważniejszy sygnał SEO i tekst zakładki przeglądarki. Google wyświetla go jako nagłówek wyniku wyszukiwania.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!titleText(c.html))
        return fail("high", "Brak", "Strona nie ma znacznika <title> — kluczowego dla SEO i kart przeglądarki.", "Dodaj w <head> znacznik <title> z unikalnym, opisowym tytułem strony.", 25);
      return ok("Jest");
    },
  },
  {
    id: "seo-title-length",
    category: "seo",
    label: "Długość tytułu",
    description:
      "Optymalny tytuł ma 30–60 znaków. Zbyt krótki marnuje potencjał, zbyt długi jest ucinany w wynikach wyszukiwania.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const len = titleText(c.html).length;
      if (len === 0) return null;
      if (len < 30 || len > 60)
        return fail("low", `${len} zn.`, `Tytuł ma ${len} znaków — poza zalecanym zakresem 30–60.`, "Dopasuj długość tytułu do 30–60 znaków, zawierając kluczową frazę.", 6);
      return ok(`${len} zn.`);
    },
  },
  {
    id: "seo-meta-description",
    category: "seo",
    label: "Meta description",
    description:
      "Opis pod tytułem w wynikach wyszukiwania. Trafny opis podnosi współczynnik klikalności (CTR).",
    run: (c) => {
      if (!c.hasHtml) return null;
      const desc = c.html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1]?.trim();
      if (desc == null)
        return fail("medium", "Brak", "Brak meta description obniża CTR i pozwala wyszukiwarce dobrać dowolny fragment.", 'Dodaj <meta name="description" content="..."> o długości 150–160 znaków.', 15);
      if (desc.length < 50 || desc.length > 160)
        return fail("low", `${desc.length} zn.`, `Opis ma ${desc.length} znaków — poza zalecanym zakresem 50–160.`, "Dostosuj długość opisu do 50–160 znaków z zachętą do kliknięcia.", 6);
      return ok(`${desc.length} zn.`);
    },
  },
  {
    id: "seo-h1",
    category: "seo",
    label: "Nagłówek H1",
    description:
      "H1 to główny nagłówek definiujący temat strony dla użytkowników i wyszukiwarek. Powinien być dokładnie jeden.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const n = count(c.html, /<h1[\s>]/gi);
      if (n === 0)
        return fail("medium", "Brak", "Brakuje nagłówka H1 definiującego główny temat strony.", "Dodaj dokładnie jeden nagłówek <h1> opisujący treść strony.", 12);
      if (n > 1)
        return fail("low", `${n}`, `Znaleziono ${n} nagłówków H1 — zaleca się dokładnie jeden.`, "Zostaw jeden H1; pozostałe zamień na H2–H6.", 6);
      return ok("1");
    },
  },
  {
    id: "seo-lang",
    category: "seo",
    label: "Atrybut lang",
    description:
      "Atrybut lang na <html> mówi wyszukiwarkom i czytnikom ekranu, w jakim języku jest treść — wpływa na indeksację i wymowę.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<html[^>]+lang=/i.test(c.html))
        return fail("low", "Brak", "Element <html> nie ma atrybutu lang — utrudnia to indeksację i dostępność.", 'Ustaw język dokumentu, np. <html lang="pl">.', 8);
      return ok("Jest");
    },
  },
  {
    id: "seo-viewport",
    category: "seo",
    label: "Meta viewport",
    description:
      "Viewport włącza responsywność na telefonach. Bez niego Google traktuje stronę jako niedostosowaną do urządzeń mobilnych.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<meta[^>]+name=["']viewport["']/i.test(c.html))
        return fail("medium", "Brak", "Brak meta viewport — strona nie skaluje się poprawnie na telefonach.", 'Dodaj <meta name="viewport" content="width=device-width, initial-scale=1">.', 12);
      return ok("Jest");
    },
  },
  {
    id: "seo-charset",
    category: "seo",
    label: "Deklaracja kodowania",
    description:
      "Meta charset (UTF-8) zapewnia poprawne wyświetlanie polskich znaków i powinna być na początku <head>.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<meta[^>]+charset=/i.test(c.html))
        return fail("low", "Brak", "Brak deklaracji kodowania znaków — ryzyko błędnego wyświetlania polskich znaków w treści.", 'Dodaj <meta charset="utf-8"> jako pierwszy element w <head>.', 5);
      return ok("Jest");
    },
  },
  {
    id: "seo-canonical",
    category: "seo",
    label: "Link canonical",
    description:
      "Adres kanoniczny wskazuje wyszukiwarce preferowaną wersję URL, zapobiegając problemom z duplikacją treści.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<link[^>]+rel=["']canonical["']/i.test(c.html))
        return fail("low", "Brak", "Brak linku canonical może rozpraszać sygnały rankingowe między duplikatami adresu.", 'Dodaj <link rel="canonical" href="..."> w <head>.', 6);
      return ok("Jest");
    },
  },
  {
    id: "seo-og",
    category: "seo",
    label: "Open Graph",
    description:
      "Znaczniki Open Graph (og:title, og:image) sterują wyglądem linku udostępnianego w social mediach i komunikatorach.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<meta[^>]+property=["']og:(title|image)["']/i.test(c.html))
        return fail("low", "Brak", "Brak znaczników Open Graph — udostępnienia nie mają miniatury ani tytułu.", "Dodaj og:title, og:description i og:image w <head>.", 5);
      return ok("Jest");
    },
  },
  {
    id: "seo-noindex",
    category: "seo",
    label: "Indeksowalność",
    description:
      "Sprawdza, czy strona nie blokuje samej siebie przed wyszukiwarkami znacznikiem robots noindex.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (/<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(c.html))
        return fail("high", "noindex", "Strona ma meta robots=noindex — wyszukiwarki jej nie zaindeksują.", "Usuń noindex, jeśli strona ma być widoczna w wynikach.", 20);
      return ok("Dozwolona");
    },
  },
  {
    id: "seo-structured-data",
    category: "seo",
    label: "Dane strukturalne",
    description:
      "JSON-LD (schema.org) odblokowuje rozszerzone wyniki wyszukiwania: oceny, FAQ, ścieżki nawigacyjne.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<script[^>]+type=["']application\/ld\+json["']/i.test(c.html))
        return fail("low", "Brak", "Brak danych strukturalnych — strona nie kwalifikuje się do rozszerzonych wyników (rich results).", "Dodaj schemat JSON-LD odpowiedni dla treści strony.", 4);
      return ok("Jest");
    },
  },
  // ---------- Dostępność ----------
  {
    id: "a11y-img-alt",
    category: "accessibility",
    label: "Teksty alternatywne obrazów",
    description:
      "Atrybut alt opisuje obraz czytnikom ekranu i pojawia się, gdy grafika się nie wczyta. Wymóg WCAG.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const total = count(c.html, /<img\b[^>]*>/gi);
      if (total === 0) return null;
      const noAlt = count(c.html, /<img\b(?![^>]*\balt=)[^>]*>/gi);
      if (noAlt > 0)
        return fail(noAlt > 3 ? "critical" : "high", `${noAlt}/${total}`, `${noAlt} z ${total} obrazów nie ma atrybutu alt — czytniki ekranu ich nie opiszą.`, 'Dodaj opisowy alt do znaczących obrazów; dla dekoracyjnych użyj alt="".', Math.min(40, noAlt * 8));
      return ok(`${total} z alt`);
    },
  },
  {
    id: "a11y-input-labels",
    category: "accessibility",
    label: "Etykiety pól formularza",
    description:
      "Każde pole formularza potrzebuje etykiety (label/aria-label), by czytnik ekranu zapowiedział, co wpisać.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const inputs = count(c.html, /<input\b(?![^>]*\btype=["'](hidden|submit|button|reset)["'])[^>]*>/gi);
      if (inputs === 0) return null;
      const noLabel = count(c.html, /<input\b(?![^>]*\b(aria-label|aria-labelledby|id)=)[^>]*>/gi);
      if (noLabel > 0)
        return fail("medium", `${noLabel}`, `${noLabel} pól formularza nie ma powiązanej etykiety — są niedostępne dla czytników ekranu.`, "Powiąż każde pole z <label for> lub dodaj aria-label.", Math.min(25, noLabel * 6));
      return ok("OK");
    },
  },
  {
    id: "a11y-empty-buttons",
    category: "accessibility",
    label: "Dostępna nazwa przycisków",
    description:
      "Przycisk bez tekstu ani aria-label jest dla czytnika ekranu bezimienny. Przyciski-ikony wymagają alternatywy tekstowej.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const empty = count(c.html, /<button\b(?![^>]*\baria-label=)[^>]*>\s*<\/button>/gi);
      if (empty > 0)
        return fail("medium", `${empty}`, `${empty} przycisków nie ma widocznego tekstu ani aria-label.`, "Dodaj tekst wewnątrz <button> lub aria-label opisujący akcję.", Math.min(20, empty * 6));
      return ok("OK");
    },
  },
  {
    id: "a11y-empty-links",
    category: "accessibility",
    label: "Treść linków",
    description:
      "Link bez tekstu (sama ikona) nie jest odczytywany przez czytniki ekranu i myli nawigację klawiaturą.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const empty = count(c.html, /<a\b(?![^>]*\baria-label=)[^>]*>\s*<\/a>/gi);
      if (empty > 0)
        return fail("low", `${empty}`, `${empty} linków nie ma tekstu ani aria-label.`, "Dodaj widoczny tekst linku lub aria-label opisujący cel.", Math.min(15, empty * 4));
      return ok("OK");
    },
  },
  {
    id: "a11y-tabindex",
    category: "accessibility",
    label: "Kolejność fokusu (tabindex)",
    description:
      "Dodatni tabindex wymusza sztuczną kolejność fokusu, która zwykle dezorientuje osoby korzystające z klawiatury.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const pos = count(c.html, /tabindex=["'][1-9]/gi);
      if (pos > 0)
        return fail("low", `${pos}`, `Znaleziono ${pos} elementów z dodatnim tabindex — zaburza to naturalną kolejność fokusu.`, "Używaj tabindex=0 lub kolejności w DOM zamiast wartości dodatnich.", Math.min(12, pos * 4));
      return ok("OK");
    },
  },
  {
    id: "a11y-iframe-title",
    category: "accessibility",
    label: "Tytuły ramek iframe",
    description:
      "Każda ramka <iframe> potrzebuje atrybutu title, aby czytnik ekranu mógł zapowiedzieć jej zawartość.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const total = count(c.html, /<iframe\b[^>]*>/gi);
      if (total === 0) return null;
      const noTitle = count(c.html, /<iframe\b(?![^>]*\btitle=)[^>]*>/gi);
      if (noTitle > 0)
        return fail("medium", `${noTitle}`, `${noTitle} ramek iframe nie ma atrybutu title.`, "Dodaj title do każdego <iframe> opisujący jego zawartość.", Math.min(15, noTitle * 5));
      return ok("OK");
    },
  },
  {
    id: "a11y-video-captions",
    category: "accessibility",
    label: "Napisy do multimediów",
    description:
      "Materiały wideo powinny mieć ścieżkę napisów (<track kind=captions>) dla osób niesłyszących.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (count(c.html, /<video\b[^>]*>/gi) === 0) return null;
      if (count(c.html, /<track\b[^>]*kind=["']captions["']/gi) === 0)
        return fail("medium", "Brak", "Materiał wideo nie ma ścieżki napisów — jest niedostępny dla osób niesłyszących.", 'Dodaj <track kind="captions" srclang="pl" src="..."> do <video>.', 10);
      return ok("Jest");
    },
  },
  {
    id: "a11y-zoom",
    category: "accessibility",
    label: "Blokada powiększania",
    description:
      "user-scalable=no lub maximum-scale=1 w viewport blokuje powiększanie strony — szkodzi osobom słabowidzącym.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (/<meta[^>]+name=["']viewport["'][^>]*content=["'][^"']*(user-scalable=no|maximum-scale=1)/i.test(c.html))
        return fail("medium", "Zablokowane", "Viewport blokuje powiększanie strony — utrudnia korzystanie osobom słabowidzącym.", "Usuń user-scalable=no oraz maximum-scale z meta viewport.", 10);
      return ok("Dozwolone");
    },
  },
  // ---------- Bezpieczeństwo / dobre praktyki ----------
  {
    id: "sec-https",
    category: "security",
    label: "Zasoby po HTTPS",
    description:
      "Zasoby ładowane po http:// na stronie HTTPS wywołują ostrzeżenia mixed content i grożą przechwyceniem (MITM).",
    run: (c) => {
      if (!c.hasHtml) return null;
      const n = count(c.html, /(?:src|href)=["']http:\/\//gi);
      if (n > 0)
        return fail("low", `${n}`, `${n} zasobów ładowanych po http:// (mixed content) na stronie HTTPS.`, "Zmień odwołania http:// na https:// lub adresy względne.", Math.min(15, n * 3));
      return ok("OK");
    },
  },
  {
    id: "sec-blank-noopener",
    category: "security",
    label: 'Linki target="_blank"',
    description:
      'Link w nowej karcie bez rel="noopener" daje nowej stronie dostęp do window.opener (atak tabnabbing).',
    run: (c) => {
      if (!c.hasHtml) return null;
      const n = count(c.html, /<a\b(?=[^>]*target=["']_blank["'])(?![^>]*rel=["'][^"']*noopener)[^>]*>/gi);
      if (n > 0)
        return fail("medium", `${n}`, `${n} linków target="_blank" bez rel="noopener" — ryzyko tabnabbingu.`, 'Dodaj rel="noopener noreferrer" do linków z target="_blank".', 10);
      return ok("OK");
    },
  },
  {
    id: "sec-eval",
    category: "security",
    label: "eval() / new Function()",
    description:
      "Dynamiczne wykonywanie kodu (eval, new Function) to poważne ryzyko XSS i uniemożliwia restrykcyjne CSP.",
    run: (c) => {
      if (/\beval\s*\(/.test(c.all) || /new\s+Function\s*\(/.test(c.all))
        return fail("high", "Wykryto", "Użycie eval()/new Function() pozwala wstrzyknąć i wykonać dowolny kod (XSS).", "Zastąp eval/new Function bezpiecznymi alternatywami (JSON.parse, mapy funkcji).", 20);
      return ok("Brak");
    },
  },
  {
    id: "sec-innerhtml",
    category: "security",
    label: "Przypisania innerHTML",
    description:
      "Wstawianie HTML przez innerHTML z niezaufanych danych to klasyczny wektor ataku XSS.",
    run: (c) => {
      const n = count(c.all, /\.innerHTML\s*=/g);
      if (n > 0)
        return fail("medium", `${n}`, `Znaleziono ${n} przypisań do innerHTML — ryzyko XSS przy niezaufanych danych.`, "Używaj textContent lub sanityzuj treść (np. DOMPurify) przed wstawieniem.", 12);
      return ok("Brak");
    },
  },
  {
    id: "sec-secrets",
    category: "security",
    label: "Sekrety w kodzie",
    description:
      "Klucze API, hasła i tokeny w kodzie klienta są jawne dla każdego. Powinny pozostać po stronie serwera.",
    run: (c) => {
      if (/(api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"']{8,}/i.test(c.all))
        return fail("critical", "Wykryto", "W kodzie znaleziono ciąg wyglądający jak klucz/sekret — nie powinien trafić do klienta.", "Przenieś sekrety do zmiennych środowiskowych serwera i zrotuj ujawniony klucz.", 30);
      return ok("Brak");
    },
  },
  {
    id: "sec-inline-handlers",
    category: "security",
    label: "Inline event handlers",
    description:
      'Atrybuty typu onclick="..." mieszają kod z HTML i zmuszają do luźniejszego CSP (unsafe-inline), zwiększając ryzyko XSS.',
    run: (c) => {
      if (!c.hasHtml) return null;
      const n = count(c.html, /<[^>]+\son[a-z]+=["']/gi);
      if (n > 0)
        return fail("low", `${n}`, `${n} inline'owych handlerów zdarzeń (np. onclick) — utrudniają restrykcyjne CSP.`, "Przenieś logikę do plików JS i podłącz przez addEventListener.", Math.min(12, n * 2));
      return ok("Brak");
    },
  },
  {
    id: "sec-document-write",
    category: "security",
    label: "document.write()",
    description:
      "document.write blokuje parser, może nadpisać całą stronę i bywa nadużywany do wstrzykiwania treści.",
    run: (c) => {
      const n = count(c.all, /document\.write\s*\(/g);
      if (n > 0)
        return fail("low", `${n}`, `Znaleziono ${n} wywołań document.write() — blokują render i są ryzykowne.`, "Zastąp document.write manipulacją DOM (createElement/append) lub szablonami.", 6);
      return ok("Brak");
    },
  },
  {
    id: "sec-csp",
    category: "security",
    label: "Content-Security-Policy",
    description:
      "CSP ogranicza źródła skryptów i zasobów — to kluczowa warstwa obrony przed XSS i wstrzyknięciami.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<meta[^>]+http-equiv=["']content-security-policy["']/i.test(c.html))
        return fail("low", "Brak (meta)", "Brak CSP w meta — jeśli nie ustawiasz go nagłówkiem HTTP, strona jest bardziej podatna na XSS.", "Wdróż nagłówek Content-Security-Policy (najlepiej po stronie serwera).", 6);
      return ok("Jest");
    },
  },
  {
    id: "sec-sri",
    category: "security",
    label: "Integralność zasobów (SRI)",
    description:
      "Atrybut integrity przy skryptach z CDN gwarantuje wykonanie tylko niezmienionego pliku (ochrona łańcucha dostaw).",
    run: (c) => {
      if (!c.hasHtml) return null;
      const ext = count(c.html, /<script\b[^>]*\bsrc=["']https?:\/\/[^"']+["'][^>]*>/gi);
      if (ext === 0) return null;
      const withSri = count(c.html, /<script\b[^>]*\bsrc=["']https?:\/\/[^"']+["'][^>]*\bintegrity=/gi);
      if (withSri < ext)
        return fail("low", `${ext - withSri}`, `${ext - withSri} zewnętrznych skryptów bez atrybutu integrity (SRI).`, "Dodaj integrity i crossorigin do skryptów ładowanych z CDN.", Math.min(10, (ext - withSri) * 3));
      return ok("OK");
    },
  },
  {
    id: "sec-password-form",
    category: "security",
    label: "Formularze haseł",
    description:
      "Pole hasła musi trafiać przez formularz wysyłany po HTTPS; wysyłka po http naraża dane logowania.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<input\b[^>]*type=["']password["']/i.test(c.html)) return null;
      if (/<form\b[^>]*action=["']http:\/\//i.test(c.html))
        return fail("high", "HTTP", "Formularz z hasłem wysyła dane po niezaszyfrowanym http://.", "Ustaw action formularza na adres https:// (lub względny na stronie HTTPS).", 20);
      return ok("OK");
    },
  },
  // ---------- Wydajność (statycznie) ----------
  {
    id: "perf-blocking-scripts",
    category: "performance",
    label: "Skrypty blokujące",
    description:
      "Zewnętrzne skrypty bez async/defer wstrzymują parsowanie HTML i opóźniają pierwsze wyświetlenie treści.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const n = count(c.html, /<script\b(?![^>]*\b(async|defer)\b)(?![^>]*type=["']module)[^>]*\bsrc=/gi);
      if (n > 0)
        return fail("medium", `${n}`, `${n} skryptów bez async/defer blokuje render.`, "Dodaj defer (lub async) albo przenieś skrypty na koniec <body>.", Math.min(25, n * 6));
      return ok("0");
    },
  },
  {
    id: "perf-img-dims",
    category: "performance",
    label: "Wymiary obrazów",
    description:
      "Obraz bez width/height rezerwuje 0 px do czasu wczytania, powodując przeskoki układu (CLS).",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (count(c.html, /<img\b[^>]*>/gi) === 0) return null;
      const n = count(c.html, /<img\b(?![^>]*\b(width|height)=)[^>]*>/gi);
      if (n > 0)
        return fail("low", `${n}`, `${n} obrazów bez width/height — powoduje przesunięcia układu (CLS).`, "Ustaw width i height (lub aspect-ratio w CSS) dla obrazów.", Math.min(18, n * 5));
      return ok("OK");
    },
  },
  {
    id: "perf-lazy",
    category: "performance",
    label: "Leniwe ładowanie",
    description:
      'Atrybut loading="lazy" odracza ładowanie obrazów spoza ekranu, skracając czas pierwszego wyświetlenia.',
    run: (c) => {
      if (!c.hasHtml) return null;
      const total = count(c.html, /<img\b[^>]*>/gi);
      if (total < 4) return null;
      const lazy = count(c.html, /<img\b[^>]*loading=["']lazy["']/gi);
      if (lazy === 0)
        return fail("low", "Brak", `Żaden z ${total} obrazów nie używa loading="lazy".`, 'Dodaj loading="lazy" do obrazów spoza pierwszego ekranu.', 6);
      return ok(`${lazy}/${total}`);
    },
  },
  {
    id: "perf-preconnect",
    category: "performance",
    label: "Wskazówki preconnect",
    description:
      "rel=preconnect/dns-prefetch skraca czas nawiązania połączenia z zewnętrznymi domenami (fonty, CDN, analityka).",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<(script|link)\b[^>]*(src|href)=["']https?:\/\//i.test(c.html)) return null;
      if (!/<link[^>]+rel=["'](preconnect|dns-prefetch)["']/i.test(c.html))
        return fail("low", "Brak", "Strona łączy się z zewnętrznymi domenami bez wskazówek preconnect/dns-prefetch.", 'Dodaj <link rel="preconnect" href="..."> dla krytycznych domen zewnętrznych.', 4);
      return ok("Jest");
    },
  },
  {
    id: "perf-inline-css",
    category: "performance",
    label: "Duże bloki inline CSS",
    description:
      "Bardzo duży inline <style> powiększa dokument HTML i nie jest cache'owany między podstronami.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const total = (c.html.match(/<style\b[^>]*>([\s\S]*?)<\/style>/gi) ?? []).reduce((n, s) => n + s.length, 0);
      if (total > 50_000)
        return fail("low", `${Math.round(total / 1024)} KB`, `Inline CSS waży ${Math.round(total / 1024)} KB — powiększa dokument i nie jest cache'owany.`, "Przenieś większość stylów do zewnętrznego pliku .css.", 6);
      return ok(total > 0 ? `${Math.round(total / 1024)} KB` : "OK");
    },
  },
  {
    id: "perf-font-display",
    category: "performance",
    label: "font-display",
    description:
      "font-display: swap zapobiega niewidocznemu tekstowi (FOIT) w trakcie pobierania własnych czcionek.",
    run: (c) => {
      if (!/@font-face/i.test(c.all)) return null;
      if (!/font-display\s*:/i.test(c.all))
        return fail("low", "Brak", "@font-face bez font-display może ukrywać tekst do czasu pobrania czcionki (FOIT).", "Dodaj font-display: swap do reguł @font-face.", 5);
      return ok("Jest");
    },
  },
  // ---------- Rozszerzenie (nowe reguły, Faza D) ----------
  {
    id: "seo-favicon",
    category: "seo",
    label: "Favicon",
    description:
      "A favicon is the small icon shown in browser tabs, bookmarks and search results — part of a credible, polished presence.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<link[^>]+rel=["'][^"']*icon/i.test(c.html))
        return fail("low", "Missing", "No favicon link found.", "Add a <link rel=\"icon\"> to the <head>.", 3);
      return ok("Present");
    },
  },
  {
    id: "seo-twitter-card",
    category: "seo",
    label: "Twitter Card",
    description:
      "Twitter/X Card tags control how the page looks when shared on X — a large image card drives far more engagement than a bare link.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<meta[^>]+name=["']twitter:card["']/i.test(c.html))
        return fail("low", "Missing", "No twitter:card meta found.", "Add twitter:card (and twitter:title/image) meta tags.", 3);
      return ok("Present");
    },
  },
  {
    id: "a11y-skip-link",
    category: "accessibility",
    label: "Skip to content link",
    description:
      "A skip link lets keyboard and screen-reader users jump past repetitive navigation straight to the main content.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const hasNav = /<nav[\s>]/i.test(c.html);
      if (!hasNav) return null;
      if (!/<a[^>]+href=["']#[^"']+["'][^>]*>\s*(skip|przejd[źz])/i.test(c.html))
        return fail("low", "Missing", "No 'skip to content' link detected before the navigation.", "Add a visually-hidden skip link as the first focusable element.", 4);
      return ok("Present");
    },
  },
  {
    id: "a11y-landmark-main",
    category: "accessibility",
    label: "Main landmark",
    description:
      "A <main> landmark (or role=\"main\") lets assistive tech jump directly to the primary content region of the page.",
    run: (c) => {
      if (!c.hasHtml) return null;
      if (!/<main[\s>]/i.test(c.html) && !/role=["']main["']/i.test(c.html))
        return fail("medium", "Missing", "No <main> landmark found.", "Wrap the primary content in a single <main> element.", 8);
      return ok("Present");
    },
  },
  {
    id: "a11y-duplicate-id",
    category: "accessibility",
    label: "Unique element IDs",
    description:
      "Duplicate id attributes break label associations, aria-* references and in-page anchors, confusing assistive tech.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const ids = [...c.html.matchAll(/\sid=["']([^"']+)["']/gi)].map((m) => m[1]);
      const seen = new Set<string>();
      const dupes = new Set<string>();
      for (const id of ids) {
        if (seen.has(id)) dupes.add(id);
        seen.add(id);
      }
      if (dupes.size > 0)
        return fail("medium", `${dupes.size}`, `${dupes.size} id value(s) are used more than once.`, "Make every id unique within the page.", Math.min(18, dupes.size * 6));
      return ok("OK");
    },
  },
  {
    id: "perf-dom-size",
    category: "performance",
    label: "DOM size",
    description:
      "A very large DOM slows style, layout and script work on every interaction and inflates memory use.",
    run: (c) => {
      if (!c.hasHtml) return null;
      const n = count(c.html, /<[a-z][a-z0-9-]*(\s|>)/gi);
      if (n > 1500)
        return fail("medium", `~${n} els`, `The page renders roughly ${n} elements — large DOMs slow rendering and interaction.`, "Reduce nesting, virtualize long lists, and split heavy pages.", 12);
      return ok(`~${n} els`);
    },
  },
];

export function runStaticRules(sources: Source[]): StaticResult {
  const html = sources
    .filter((s) => /\.html?$/i.test(s.name) || /<html|<!doctype|<body|<div/i.test(s.content))
    .map((s) => s.content)
    .join("\n");
  const js = sources
    .filter((s) => /\.(m?js|ts|jsx|tsx)$/i.test(s.name))
    .map((s) => s.content)
    .join("\n");
  const css = sources
    .filter((s) => /\.css$/i.test(s.name))
    .map((s) => s.content)
    .join("\n");
  const all = sources.map((s) => s.content).join("\n");

  const ctx: CheckContext = { html, js, css, all, hasHtml: html.trim().length > 0 };

  const baseScores: Record<CategoryKey, number> = {
    performance: 100,
    seo: 100,
    accessibility: 100,
    security: 100,
  };
  const metricsByCat: Record<CategoryKey, Metric[]> = {
    performance: [],
    seo: [],
    accessibility: [],
    security: [],
  };
  const recommendations: Recommendation[] = [];

  for (const check of CHECKS) {
    const outcome = check.run(ctx);
    if (!outcome) continue; // kontrola nie dotyczy tego wejścia

    metricsByCat[check.category].push({
      id: check.id,
      label: check.label,
      value: outcome.value,
      description: check.description,
      status: outcome.status,
    });

    if (outcome.finding) {
      baseScores[check.category] -= outcome.finding.penalty;
      recommendations.push({
        id: `static-${recommendations.length}`,
        category: check.category,
        severity: outcome.finding.severity,
        title: check.label,
        problem: outcome.finding.problem,
        fix: outcome.finding.fix,
        docId: check.id,
        evidence: String(outcome.value),
      });
    }
  }

  const categories: CategoryResult[] = CATEGORY_KEYS.map((key) => {
    const metrics = metricsByCat[key];
    if (metrics.length === 0) {
      // Żadna kontrola nie dotyczyła kategorii (np. samodzielny arkusz CSS).
      return {
        key,
        score: 80,
        metrics: [
          {
            id: `${key}-na`,
            label: "Brak danych do analizy w tej kategorii",
            value: "—",
            description: "Dostarczone wejście nie zawierało treści potrzebnej do tych kontroli.",
            status: "warn" as MetricStatus,
          },
        ],
      };
    }
    return { key, score: Math.max(0, Math.min(100, baseScores[key])), metrics };
  });

  return { categories, recommendations };
}











