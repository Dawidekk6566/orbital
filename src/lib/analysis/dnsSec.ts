import { resolveTxt, resolveCaa, resolveMx } from "node:dns/promises";
import type { DnsSecInfo, Recommendation } from "./types";

/* ============================================================
   Audyt DNS & Bezpieczeństwa Domeny (DNS Security Suite)
   Sprawdza rekordy SPF, DMARC, CAA, MX.
   Wywoływane bezpiecznie po walidacji SSRF.
   Timeout per kwerenda (3500ms) zapobiega zawieszeniu analizy.
   ============================================================ */

function withTimeout<T>(promise: Promise<T>, ms = 3500, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

function extractApexDomain(hostname: string): string {
  const parts = hostname.replace(/^www\./i, "").split(".");
  if (parts.length <= 2) return parts.join(".");
  // Obsługa np. co.uk, com.pl, edu.pl itp.
  const secondLast = parts[parts.length - 2];
  if (["co", "com", "org", "net", "edu", "gov"].includes(secondLast) && parts.length > 2) {
    return parts.slice(-3).join(".");
  }
  return parts.slice(-2).join(".");
}

export async function analyzeDns(hostname: string): Promise<{
  dns: DnsSecInfo;
  recommendations: Recommendation[];
}> {
  const domain = extractApexDomain(hostname);
  const recommendations: Recommendation[] = [];
  let recIdx = 0;

  const pushRec = (
    severity: Recommendation["severity"],
    title: string,
    problem: string,
    fix: string,
    docId?: string
  ) => {
    recommendations.push({
      id: `dns-rec-${recIdx++}`,
      category: "security",
      severity,
      title,
      problem,
      fix,
      docId,
    });
  };

  // 1. Sprawdzenie TXT domeny (SPF)
  const txtRecords = await withTimeout(
    resolveTxt(domain).catch(() => []),
    3500,
    []
  );
  const flatTxt = txtRecords.map((chunks) => chunks.join(""));
  const spfRecord = flatTxt.find((r) => r.toLowerCase().startsWith("v=spf1"));

  let spfStatus: DnsSecInfo["spf"];
  if (spfRecord) {
    const isWeak = spfRecord.includes("+all") || (!spfRecord.includes("-all") && !spfRecord.includes("~all"));
    spfStatus = {
      present: true,
      value: spfRecord,
      details: isWeak
        ? "SPF record exists but allows all senders (+all or missing enforcement)."
        : "Valid SPF policy configured.",
      status: isWeak ? "warn" : "good",
    };
    if (isWeak) {
      pushRec(
        "high",
        "Weak SPF policy in DNS",
        `Domain ${domain} has an SPF record, but it does not strictly restrict unauthorized mail senders.`,
        `Update the SPF TXT record on ${domain} to end with '~all' (softfail) or '-all' (hardfail), e.g.: 'v=spf1 include:_spf.google.com ~all'.`
      );
    }
  } else {
    spfStatus = {
      present: false,
      details: "No SPF record found. Domain is vulnerable to email spoofing.",
      status: "bad",
    };
    pushRec(
      "high",
      "Missing SPF record in DNS",
      `The domain ${domain} does not have an SPF (Sender Policy Framework) TXT record, allowing attackers to spoof emails from your domain.`,
      `Add a TXT record to ${domain}: Name '@', Value 'v=spf1 -all' (or include your mail providers).`
    );
  }

  // 2. Sprawdzenie DMARC (_dmarc.domain)
  const dmarcRecords = await withTimeout(
    resolveTxt(`_dmarc.${domain}`).catch(() => []),
    3500,
    []
  );
  const flatDmarc = dmarcRecords.map((chunks) => chunks.join(""));
  const dmarcRecord = flatDmarc.find((r) => r.toLowerCase().startsWith("v=dmarc1"));

  let dmarcStatus: DnsSecInfo["dmarc"];
  if (dmarcRecord) {
    const isNone = /p=none/i.test(dmarcRecord);
    dmarcStatus = {
      present: true,
      value: dmarcRecord,
      details: isNone
        ? "DMARC policy set to p=none (monitoring only, not rejecting spoofed emails)."
        : "Enforced DMARC policy active (p=quarantine or p=reject).",
      status: isNone ? "warn" : "good",
    };
    if (isNone) {
      pushRec(
        "medium",
        "DMARC policy is not strictly enforced",
        `DMARC record on ${domain} uses 'p=none', which only collects reports without blocking fake emails.`,
        "Transition DMARC policy from 'p=none' to 'p=quarantine' or 'p=reject' once legitimate senders are verified."
      );
    }
  } else {
    dmarcStatus = {
      present: false,
      details: "No DMARC policy detected.",
      status: "bad",
    };
    pushRec(
      "high",
      "Missing DMARC policy in DNS",
      `Without DMARC on _dmarc.${domain}, receiving mail servers cannot verify authenticity, leading to phishing and lower deliverability.`,
      `Create a TXT record for '_dmarc.${domain}' with value 'v=DMARC1; p=reject; rua=mailto:dmarc-reports@${domain}'.`
    );
  }

  // 3. Sprawdzenie CAA (Certification Authority Authorization)
  const caaRecords = await withTimeout(
    resolveCaa(domain).catch(() => []),
    3500,
    []
  );

  let caaStatus: DnsSecInfo["caa"];
  if (caaRecords.length > 0) {
    const values = caaRecords.map((c) => `${c.issue ? `issue "${c.issue}"` : ""}${c.issuewild ? ` issuewild "${c.issuewild}"` : ""}`).filter(Boolean);
    caaStatus = {
      present: true,
      value: values.join("; "),
      details: `Configured for authorized CAs: ${values.join(", ")}`,
      status: "good",
    };
  } else {
    caaStatus = {
      present: false,
      details: "No CAA record found. Any public Certificate Authority can issue certificates for this domain.",
      status: "warn",
    };
    pushRec(
      "low",
      "Missing CAA record in DNS",
      `Domain ${domain} does not publish CAA records, allowing any public CA to issue TLS certificates if compromised.`,
      `Add CAA records in your DNS specifying your chosen provider, e.g. '0 issue "letsencrypt.org"'.`
    );
  }

  // 4. Rekordy MX
  const mxRecords = await withTimeout(
    resolveMx(domain).catch(() => []),
    3500,
    []
  );
  const mxList = mxRecords.map((m) => `${m.exchange} (pri ${m.priority})`);

  return {
    dns: {
      spf: spfStatus,
      dmarc: dmarcStatus,
      caa: caaStatus,
      mx: mxList.length > 0 ? mxList : undefined,
    },
    recommendations,
  };
}
