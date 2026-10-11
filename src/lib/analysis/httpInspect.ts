import tls from "node:tls";
import { assertSafeUrl } from "../ssrf";
import type { TlsInfo } from "./renderArtifact";

/* ============================================================
   httpInspect — serwerowa inspekcja URL BEZ przeglądarki:
   pobiera nagłówki + HTML (podążając bezpiecznie za przekierowaniami,
   każdy skok re-walidowany SSRF) oraz certyfikat/konfigurację TLS
   przez gniazdo (node:tls). Baza dla analizatorów security / tech-stack.
   Wszystko z limitami czasu i rozmiaru; błąd → pole pominięte.
   ============================================================ */

export interface Inspection {
  finalUrl: string;
  status: number | null;
  headers: Record<string, string>;
  html: string | null;
  tls?: TlsInfo;
}

const MAX_BODY = 2_000_000;
const MAX_HOPS = 3;

/** Pola DN certyfikatu bywają string | string[] — normalizujemy do string. */
function str(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v || undefined;
}

async function readBody(res: Response): Promise<string | null> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("text/html")) return null;
  const reader = res.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_BODY) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  reader.cancel().catch(() => {});
  const buf = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    buf.set(c.subarray(0, Math.max(0, Math.min(c.length, MAX_BODY - off))), off);
    off += c.length;
  }
  return new TextDecoder().decode(buf);
}

/** Certyfikat + protokół TLS dla hosta (https). Błąd → undefined. */
function getTlsInfo(host: string): Promise<TlsInfo | undefined> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (v: TlsInfo | undefined) => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {
        /* ignore */
      }
      resolve(v);
    };
    const socket = tls.connect(
      { host, port: 443, servername: host, timeout: 8000, rejectUnauthorized: false },
      () => {
        const cert = socket.getPeerCertificate();
        if (!cert || Object.keys(cert).length === 0) return done(undefined);
        const validTo = cert.valid_to ? new Date(cert.valid_to) : undefined;
        const daysToExpiry = validTo
          ? Math.round((validTo.getTime() - Date.now()) / 86_400_000)
          : undefined;
        done({
          protocol: socket.getProtocol() ?? undefined,
          issuer: str(cert.issuer?.O) ?? str(cert.issuer?.CN),
          subject: str(cert.subject?.CN),
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          daysToExpiry,
          valid: socket.authorized,
        });
      },
    );
    socket.on("error", () => done(undefined));
    socket.on("timeout", () => done(undefined));
  });
}

/** Pobiera nagłówki + HTML, bezpiecznie podążając za przekierowaniami. */
export async function inspectHttp(rawUrl: string): Promise<Inspection> {
  let current = (await assertSafeUrl(rawUrl)).toString();
  let status: number | null = null;
  let headers: Record<string, string> = {};
  let html: string | null = null;

  for (let hop = 0; hop < MAX_HOPS; hop++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch(current, {
        signal: controller.signal,
        redirect: "manual",
        headers: { "User-Agent": "OrbitalAudit/1.0 (+analyzer)" },
      });
      status = res.status;
      headers = Object.fromEntries(
        [...res.headers.entries()].map(([k, v]) => [k.toLowerCase(), v]),
      );

      // Bezpieczne podążanie za przekierowaniem (jeden skok, re-walidacja SSRF).
      if (res.status >= 300 && res.status < 400 && headers["location"]) {
        const next = new URL(headers["location"], current);
        current = (await assertSafeUrl(next.toString())).toString();
        continue;
      }

      if (res.ok) html = await readBody(res);
      break;
    } catch {
      break;
    } finally {
      clearTimeout(timeout);
    }
  }

  const finalUrl = current;
  let tlsInfo: TlsInfo | undefined;
  try {
    const u = new URL(finalUrl);
    if (u.protocol === "https:") tlsInfo = await getTlsInfo(u.hostname);
  } catch {
    /* ignore */
  }

  return { finalUrl, status, headers, html, tls: tlsInfo };
}
