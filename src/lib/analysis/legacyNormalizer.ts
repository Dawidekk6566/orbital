import type { Metric, Recommendation } from "./types";
import { CHECK_DOCS } from "./checkDocs";

/**
 * Normalizes legacy Polish audit data into English.
 * This guarantees that older stored reports, demo states, or cached audits
 * render entirely in English in all dashboard sections.
 */

const LABEL_MAP: Record<string, string> = {
  "Znacznik <title>": "<title> tag",
  "Długość znacznika <title>": "<title> tag length",
  "Opis strony (meta description)": "Meta description",
  "Długość meta description": "Meta description length",
  "Znacznik viewport": "Viewport meta tag",
  "Atrybut lang znacznika <html>": "<html> lang attribute",
  "Nagłówek H1": "H1 heading",
  "Atrybuty alt w obrazkach": "Image alt attributes",
  "Teksty linków": "Descriptive link texts",
  "Protokół HTTPS": "HTTPS protocol",
  "Zasoby mieszane (Mixed Content)": "Mixed Content",
  'Linki zewnętrzne (rel="noopener")': 'External links (rel="noopener")',
  "Deklaracja kodowania znaków (charset)": "Character encoding declaration (charset)",
  "Formaty obrazów nowej generacji": "Modern image formats",
  "Leniwe ładowanie obrazów (lazy loading)": "Lazy loading images",
  "Wstępne łączenie z kluczowymi domenami": "Preconnect to key domains",
  "Skrypty blokujące renderowanie": "Render-blocking scripts",
  "Wbudowane style i skrypty (inline)": "Inline styles and scripts",
  "Etykiety pól formularza": "Form input labels",
  "Atrybuty title w ramkach <iframe>": "<iframe> title attributes",
  "Tekst alternatywny dla elementów interaktywnych": "Accessible names for interactive controls",
  "Struktura nagłówków (H1–H6)": "Heading structure (H1–H6)",
  "Kontrast elementów tekstowych": "Text element contrast",
  "Brak danych do analizy w tej kategorii": "No analysis data in this category",
  "Ocena wizualna (AI)": "Visual assessment (AI)",
  "Czas reakcji serwera (TTFB)": "Server response time (TTFB)",
  "Kompresja tekstu": "Text compression",
  "Nieużywany CSS": "Unused CSS",
  "Responsywne obrazy": "Responsive images",
  "Tytuł dokumentu": "Document title",
  "Indeksowalność": "Indexability",
};

const TITLE_MAP: Record<string, string> = {
  "Dodaj znacznik <title>": "Add a <title> tag",
  "Dopasuj długość znacznika <title>": "Optimize <title> length",
  "Dodaj opis meta description": "Add a meta description",
  "Dopasuj długość meta description": "Optimize meta description length",
  "Dodaj znacznik viewport": "Add a viewport meta tag",
  "Dodaj atrybut lang do znacznika <html>": "Add lang attribute to <html>",
  "Dodaj dokładnie jeden nagłówek <h1>": "Use a single <h1> heading",
  "Uzupełnij atrybuty alt w obrazkach": "Add missing alt attributes on images",
  "Użyj opisowych tekstów linków": "Use descriptive anchor texts",
  "Wymuś protokół HTTPS": "Enforce HTTPS protocol",
  "Usuń zasoby wczytywane po nieszyfrowanym HTTP": "Eliminate mixed content (HTTP)",
  'Zabezpiecz linki zewnętrzne atrybutem rel="noopener"': 'Protect external links with rel="noopener"',
  "Zadeklaruj kodowanie UTF-8": "Declare UTF-8 character encoding",
  "Zastąp przestarzałe formaty nowoczesnymi (WebP, AVIF)": "Serve images in modern formats (WebP, AVIF)",
  'Włącz leniwe ładowanie obrazów (loading="lazy")': 'Enable lazy loading on off-screen images',
  "Dodaj dns-prefetch lub preconnect dla domen zewnętrznych": "Add preconnect/dns-prefetch for external domains",
  "Odłóż wykonywanie skryptów blokujących (defer lub async)": "Defer or async render-blocking scripts",
  "Wynieś kod inline do zewnętrznych plików CSS/JS": "Extract inline styles and scripts into external files",
  "Powiąż etykiety <label> z polami formularza": "Associate <label> elements with form inputs",
  "Dodaj opisowy atrybut title do każdej ramki <iframe>": "Add descriptive title attributes to <iframe> elements",
  "Dodaj aria-label do przycisków bez tekstu": "Add aria-label to icon-only buttons",
  "Napraw hierarchię nagłówków": "Fix heading level hierarchy",
  "Zwiększ kontrast tekstu do tła": "Improve text-to-background contrast",
};

export function normalizeLegacyMetric(m: Metric): Metric {
  let label = LABEL_MAP[m.label] ?? m.label;
  let description = m.description;
  let value = m.value;

  if (typeof value === "string") {
    if (value === "Brak") value = "None";
    else if (value === "Brak danych") value = "No data";
    else if (value === "Wszystkie OK") value = "All OK";
    else if (value === "Zgodne") value = "Compliant";
  }

  // If description has Polish fallback, replace with English
  if (description?.includes("Dostarczone wejście nie zawierało")) {
    description = "The provided input did not contain content required for these checks.";
  }

  // If there's an exact check doc, fallback description to doc.what if description contains Polish chars
  if (CHECK_DOCS[m.id] && description && /[ąćęłńóśźż]/i.test(description)) {
    description = CHECK_DOCS[m.id].what;
  }

  return {
    ...m,
    label,
    description,
    value,
  };
}

export function normalizeLegacyRecommendation(r: Recommendation): Recommendation {
  let title = TITLE_MAP[r.title] ?? r.title;
  let problem = r.problem;
  let fix = r.fix;

  const doc = r.docId ? CHECK_DOCS[r.docId] : undefined;

  // If Polish chars are detected in problem/fix, substitute from doc if available
  if (doc) {
    if (/[ąćęłńóśźż]/i.test(problem)) {
      problem = doc.why;
    }
    if (doc.fix && /[ąćęłńóśźż]/i.test(fix)) {
      fix = doc.fix;
    }
  }

  return {
    ...r,
    title,
    problem,
    fix,
  };
}
