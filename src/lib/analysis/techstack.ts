import type { TechEntry } from "./types";

/* ============================================================
   Wykrywanie technologii (bez przeglądarki) — lekki fingerprint
   w stylu Wappalyzera: sygnatury w nagłówkach odpowiedzi i w HTML.
   Panel informacyjny (nie wpływa na wynik). Świadomie ostrożny:
   zgłasza tylko trafienia o wysokiej pewności, by nie zaśmiecać.
   ============================================================ */

interface Sig {
  name: string;
  category: string;
  header?: { key: string; re?: RegExp };
  html?: RegExp;
  /** Wyłuskanie wersji (opcjonalne). */
  version?: (headers: Record<string, string>, html: string) => string | undefined;
}

const SIGNATURES: Sig[] = [
  { name: "Next.js", category: "framework", html: /\/_next\/(static|image)/i, header: { key: "x-powered-by", re: /next\.js/i } },
  { name: "Nuxt", category: "framework", html: /id=["']__nuxt["']|\/_nuxt\//i },
  { name: "React", category: "framework", html: /data-reactroot|id=["']root["'][^>]*>\s*<|__reactContainer/i },
  { name: "Vue.js", category: "framework", html: /data-v-[0-9a-f]{8}|id=["']app["'][^>]*data-v-/i },
  { name: "Angular", category: "framework", html: /ng-version=|<app-root/i },
  { name: "Svelte", category: "framework", html: /svelte-[0-9a-z]{6}/i },
  { name: "Gatsby", category: "framework", html: /id=["']___gatsby["']/i },
  { name: "WordPress", category: "cms", html: /\/wp-content\/|\/wp-includes\//i },
  { name: "Shopify", category: "ecommerce", html: /cdn\.shopify\.com|Shopify\.theme/i },
  { name: "Drupal", category: "cms", html: /Drupal\.settings|\/sites\/default\/files/i },
  { name: "jQuery", category: "library", html: /jquery[.-][0-9]/i },
  { name: "Google Analytics", category: "analytics", html: /google-analytics\.com\/analytics\.js|gtag\(|googletagmanager\.com\/gtag/i },
  { name: "Google Tag Manager", category: "analytics", html: /googletagmanager\.com\/gtm\.js/i },
  { name: "Cloudflare", category: "cdn", header: { key: "server", re: /cloudflare/i } },
  { name: "Vercel", category: "hosting", header: { key: "server", re: /vercel/i } },
  { name: "Netlify", category: "hosting", header: { key: "server", re: /netlify/i } },
  { name: "Nginx", category: "server", header: { key: "server", re: /nginx/i }, version: (h) => h["server"]?.match(/nginx\/([\d.]+)/i)?.[1] },
  { name: "Apache", category: "server", header: { key: "server", re: /apache/i }, version: (h) => h["server"]?.match(/apache\/([\d.]+)/i)?.[1] },
  { name: "PHP", category: "language", header: { key: "x-powered-by", re: /php/i }, version: (h) => h["x-powered-by"]?.match(/php\/([\d.]+)/i)?.[1] },
  { name: "ASP.NET", category: "framework", header: { key: "x-powered-by", re: /asp\.net/i } },
];

export function detectTechStack(
  headers: Record<string, string>,
  html: string | null,
): TechEntry[] {
  const body = html ?? "";
  const found = new Map<string, TechEntry>();

  for (const sig of SIGNATURES) {
    let hit = false;
    if (sig.header) {
      const val = headers[sig.header.key];
      if (val && (!sig.header.re || sig.header.re.test(val))) hit = true;
    }
    if (!hit && sig.html && body && sig.html.test(body)) hit = true;
    if (!hit) continue;
    if (found.has(sig.name)) continue;
    found.set(sig.name, {
      name: sig.name,
      category: sig.category,
      version: sig.version?.(headers, body),
    });
  }

  // meta generator (CMS/SSG) — np. "WordPress 6.5", "Hugo 0.1"
  const gen = body.match(/<meta[^>]+name=["']generator["'][^>]*content=["']([^"']+)["']/i)?.[1];
  if (gen && !found.has(gen.split(/\s/)[0])) {
    const [name, version] = gen.split(/\s+(?=[\d])/);
    found.set(gen, { name: name.trim(), category: "generator", version: version?.trim() });
  }

  return [...found.values()];
}
