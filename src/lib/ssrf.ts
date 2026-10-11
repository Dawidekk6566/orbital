import { lookup } from "node:dns/promises";
import net from "node:net";

/* ============================================================
   BEZPIECZEŃSTWO — ochrona przed SSRF.
   Wywoływane po stronie serwera PRZED pobraniem dowolnego URL
   podanego przez użytkownika (tryb "url"). Blokuje adresy
   prywatne / loopback / link-local / metadata (np. 169.254.169.254).
   ============================================================ */

export class SsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfError";
  }
}

/** Czy adres IPv4 należy do zakresu prywatnego / niebezpiecznego. */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 169 && b === 254) return true; // link-local + metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  if (a >= 224) return true; // multicast / reserved
  return false;
}

/** Czy adres IPv6 należy do zakresu prywatnego / niebezpiecznego. */
function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true; // loopback / unspecified
  // IPv4 zmapowane w IPv6 (::ffff:a.b.c.d)
  const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local fc00::/7
  if (lower.startsWith("fe80")) return true; // link-local
  return false;
}

function isBlockedIp(ip: string): boolean {
  return net.isIPv4(ip) ? isPrivateIPv4(ip) : isPrivateIPv6(ip);
}

/**
 * Waliduje i zwraca bezpieczny URL lub rzuca SsrfError.
 * - dozwolone tylko http/https,
 * - blokuje niestandardowe porty,
 * - rozwiązuje nazwę DNS i odrzuca adresy prywatne (obejście przez DNS rebinding
 *   ograniczamy sprawdzając realnie rozwiązany adres).
 */
export async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SsrfError("Nieprawidłowy adres URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SsrfError("Dozwolone są tylko adresy http/https.");
  }

  // Odrzucamy nietypowe porty (np. dostęp do usług wewnętrznych).
  if (url.port && !["", "80", "443"].includes(url.port)) {
    throw new SsrfError("Niedozwolony port.");
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".local")
  ) {
    throw new SsrfError("Adresy lokalne są zablokowane.");
  }

  // Jeśli host jest literalnym IP — sprawdź od razu.
  if (net.isIP(hostname) && isBlockedIp(hostname)) {
    throw new SsrfError("Adres prywatny jest zablokowany.");
  }

  // Rozwiąż DNS i sprawdź WSZYSTKIE zwrócone adresy.
  try {
    const resolved = await lookup(hostname, { all: true });
    if (resolved.some((r) => isBlockedIp(r.address))) {
      throw new SsrfError("Host wskazuje na adres prywatny.");
    }
  } catch (err) {
    if (err instanceof SsrfError) throw err;
    throw new SsrfError("Nie udało się rozwiązać nazwy hosta.");
  }

  return url;
}
