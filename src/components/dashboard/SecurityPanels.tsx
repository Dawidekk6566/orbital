"use client";

import type { DnsSecInfo, CveEntry, CspEvaluation, SriCheck } from "@/lib/analysis/types";

const SEV_BADGE = {
  critical: "border-bad-line bg-bad-soft text-bad",
  high: "border-bad-line bg-bad-soft text-bad",
  medium: "border-warn-line bg-warn-soft text-warn",
  low: "border-good-line bg-good-soft text-good",
} as const;

export function DnsPanel({ dns }: { dns: DnsSecInfo }) {
  const records = [
    { label: "SPF (Sender Policy)", item: dns.spf },
    { label: "DMARC (Email Auth)", item: dns.dmarc },
    { label: "CAA (Cert Authority)", item: dns.caa },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {records.map(({ label, item }) => {
          const present = item?.present ?? false;
          const status = item?.status ?? "bad";
          const statusBg =
            status === "good" ? "bg-good" : status === "warn" ? "bg-warn" : "bg-bad";

          return (
            <div
              key={label}
              className="flex flex-col justify-between rounded-[8px] border border-line bg-white p-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[12px] uppercase tracking-[0.05em] text-muted">
                    {label}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className={`h-2 w-2 rounded-full ${statusBg}`} />
                    {present ? "Configured" : "Missing"}
                  </span>
                </div>
                {item?.value ? (
                  <div className="mt-2.5 overflow-x-auto rounded border border-line-2 bg-bg-soft p-2 font-mono text-[11.5px] text-ink break-all">
                    {item.value}
                  </div>
                ) : null}
              </div>
              {item?.details ? (
                <p className="mt-2.5 text-[12.5px] text-gray-1">{item.details}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {dns.mx && dns.mx.length > 0 && (
        <div className="rounded-[8px] border border-line bg-white p-4">
          <div className="font-mono text-[12px] uppercase tracking-[0.05em] text-muted">
            Mail Exchange (MX Records)
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {dns.mx.map((m) => (
              <span
                key={m}
                className="rounded-full border border-line px-3 py-1 font-mono text-[12px] text-ink"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CvePanel({ cveList }: { cveList: CveEntry[] }) {
  if (cveList.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {cveList.map((item) => (
        <div
          key={item.id}
          className="rounded-[8px] border border-line bg-white p-5 transition-colors hover:border-line-strong"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.04em] font-medium ${
                  SEV_BADGE[item.severity]
                }`}
              >
                {item.severity}
              </span>
              <span className="font-mono text-[13px] font-semibold text-ink">
                {item.cve ?? item.library}
              </span>
              <span className="font-mono text-[12px] text-muted">
                v{item.version}
              </span>
            </div>
            {item.fixVersion && (
              <span className="rounded-full border border-good-line bg-good-soft px-3 py-1 font-mono text-[11.5px] text-good">
                Fix: {item.fixVersion}
              </span>
            )}
          </div>

          <h3 className="mt-2 text-[14.5px] font-medium text-ink">{item.title}</h3>
          <p className="mt-1 text-[13px] text-gray-1">{item.summary}</p>

          {item.link && (
            <div className="mt-3">
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 font-mono text-[12px] text-ink underline underline-offset-2 hover:text-muted"
              >
                View advisory on NVD ↗
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function CspSriPanel({
  csp,
  sri,
}: {
  csp?: CspEvaluation;
  sri?: SriCheck[];
}) {
  const missingCdnIntegrity = (sri ?? []).filter(
    (s) => s.isThirdParty && !s.hasIntegrity
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* CSP Card */}
      <div className="rounded-[8px] border border-line bg-white p-5">
        <div className="flex items-baseline justify-between gap-3">
          <div className="font-mono text-[12.5px] uppercase tracking-[0.05em] text-muted">
            Content Security Policy
          </div>
          {csp?.hasCsp ? (
            <span
              className={`font-mono text-[14px] font-semibold ${
                (csp.score ?? 0) >= 80 ? "text-good" : (csp.score ?? 0) >= 50 ? "text-warn" : "text-bad"
              }`}
            >
              Score: {csp.score ?? 0}/100
            </span>
          ) : (
            <span className="rounded-full border border-bad-line bg-bad-soft px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.04em] text-bad">
              Missing
            </span>
          )}
        </div>

        {csp?.findings && csp.findings.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            <span className="text-[12px] font-medium text-ink">Detected policy weaknesses:</span>
            {csp.findings.map((f, i) => (
              <div
                key={i}
                className="rounded border border-warn-line bg-warn-soft p-2.5 text-[12.5px] text-warn"
              >
                <div className="font-mono font-medium">{f.directive}</div>
                <div className="mt-0.5">{f.issue}</div>
              </div>
            ))}
          </div>
        )}

        {csp?.missingDirectives && csp.missingDirectives.length > 0 && (
          <div className="mt-3">
            <span className="text-[12px] font-medium text-muted">Recommended additions:</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {csp.missingDirectives.map((d) => (
                <span
                  key={d}
                  className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-gray-1"
                >
                  + {d}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SRI Card */}
      <div className="rounded-[8px] border border-line bg-white p-5">
        <div className="flex items-baseline justify-between gap-3">
          <div className="font-mono text-[12.5px] uppercase tracking-[0.05em] text-muted">
            Subresource Integrity (SRI)
          </div>
          <span className="font-mono text-[12px] text-muted">
            {(sri ?? []).length} external assets
          </span>
        </div>

        {missingCdnIntegrity.length > 0 ? (
          <div className="mt-3">
            <p className="text-[13px] text-warn">
              {missingCdnIntegrity.length} external resource(s) loaded without cryptographic integrity hash:
            </p>
            <ul className="mt-2 max-h-[160px] overflow-y-auto space-y-1.5 font-mono text-[11.5px] text-ink">
              {missingCdnIntegrity.map((item, idx) => (
                <li
                  key={idx}
                  className="truncate rounded border border-line-2 bg-bg-soft px-2 py-1"
                  title={item.url}
                >
                  {item.url}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-3 text-[13px] text-good">
            All detected scripts and stylesheets use local origins or secure integrity hashes.
          </p>
        )}
      </div>
    </div>
  );
}
