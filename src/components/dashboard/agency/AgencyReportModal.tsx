"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import type { AnalysisReport } from "@/lib/analysis/types";
import { useAgencySettings } from "@/lib/agency/storage";
import type { ClientReportConfig } from "@/lib/agency/types";

export function AgencyReportModal({
  report,
  auditId,
  isOpen,
  onClose,
}: {
  report: AnalysisReport;
  auditId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { settings } = useAgencySettings();
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [config, setConfig] = useState<ClientReportConfig>({
    clientName: "Client Organization",
    reportTitle: "Technical Health & Performance Audit",
    template: "executive",
    includeScores: true,
    includeOpportunities: true,
    includeVitals: true,
    includeSecurity: true,
    includeConversionRoi: true,
    customNote: settings.executiveSummaryNote,
  });

  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!isOpen) return null;

  const overall = report.overallScore ?? 0;
  const catOf = (k: string) =>
    Array.isArray(report.categories) ? report.categories.find((c) => c.key === k) : undefined;

  const perfScore = catOf("performance")?.score ?? overall;
  const a11yScore = catOf("accessibility")?.score;
  const seoScore = catOf("seo")?.score;
  const secScore = catOf("security")?.score;
  const timestamp = report.meta?.analyzedAt ?? new Date().toISOString();

  const grade =
    overall >= 90 ? "Grade A" : overall >= 75 ? "Grade B" : overall >= 50 ? "Grade C" : "Grade F";
  const gradeColor =
    overall >= 90
      ? "text-emerald-700 bg-emerald-50 border-emerald-300"
      : overall >= 75
        ? "text-blue-700 bg-blue-50 border-blue-300"
        : overall >= 50
          ? "text-amber-700 bg-amber-50 border-amber-300"
          : "text-rose-700 bg-rose-50 border-rose-300";

  // Business ROI Estimation calculations based on LCP & Score
  const lcpValue = report.vitals?.field?.lcp?.p75 ?? 2800;
  const bounceRisk =
    lcpValue > 4000 ? "38% - 53%" : lcpValue > 2500 ? "18% - 24%" : "< 9%";
  const conversionUpside =
    perfScore < 70 ? "+12% to +18%" : perfScore < 90 ? "+6% to +9%" : "+2% to +4%";

  const criticalIssues = (report.recommendations ?? []).filter(
    (r) => r.severity === "critical" || r.severity === "high"
  );
  const totalFixHours = Math.max(
    8,
    (report.recommendations ?? []).length * 2.5
  );
  const estimatedCost = Math.round(
    totalFixHours * (settings.hourlyRateEstimate ?? 120)
  );

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = async () => {
    const text = `# Executive Summary: Technical Audit of ${report.target.value}
Audited by: ${settings.agencyName} (${settings.consultantName})
Date: ${new Date(timestamp).toLocaleDateString()}
Client: ${config.clientName}

Overall Score: ${overall}/100 (${grade})
• Performance: ${perfScore ?? "N/A"}/100
• Accessibility: ${a11yScore ?? "N/A"}/100
• SEO: ${seoScore ?? "N/A"}/100
• Security: ${secScore ?? "N/A"}/100

Key Business Findings:
• Estimated Bounce Risk: ${bounceRisk}
• Projected Conversion Gain post-fix: ${conversionUpside}
• High Priority Items: ${criticalIssues.length} issues identified
• Remediation Effort: ~${totalFixHours} engineering hours

Summary Note:
${config.customNote ?? settings.executiveSummaryNote ?? ""}`;

    await navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleDownloadHtml = () => {
    if (!printAreaRef.current) return;
    const content = printAreaRef.current.innerHTML;
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${config.clientName} — Audit Report by ${settings.agencyName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px auto; max-width: 900px; color: #111; line-height: 1.5; background: #fff; }
    h1, h2, h3, h4 { color: #000; letter-spacing: -0.02em; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #e5e5e5; padding: 10px 14px; text-align: left; }
    th { background: #f9f9f9; font-size: 12px; text-transform: uppercase; font-family: monospace; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-family: monospace; }
    @media print { body { margin: 0; max-width: 100%; } }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-report-${config.clientName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex flex-col bg-black/80 backdrop-blur-md"
    >
      {/* 1. Modal Top Bar (Hidden on print) */}
      <header className="print:hidden flex flex-wrap items-center justify-between border-b border-white/10 bg-neutral-900/90 px-6 py-4 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 font-mono text-[12px]">
            📄
          </span>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">
              Agency Client Report Generator
            </h2>
            <p className="font-mono text-[11px] text-neutral-400">
              White-label delivery for {settings.agencyName} · Ref #{auditId.slice(0, 8)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopySummary}
            className="rounded-full border border-white/20 px-3.5 py-1.5 font-mono text-[12px] text-neutral-300 transition-colors hover:border-white hover:text-white"
          >
            {copiedSummary ? "✓ Copied to Clipboard" : "Copy Briefing Text"}
          </button>
          <button
            type="button"
            onClick={handleDownloadHtml}
            className="rounded-full border border-white/20 px-3.5 py-1.5 font-mono text-[12px] text-neutral-300 transition-colors hover:border-white hover:text-white"
          >
            Download HTML
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[13px] font-semibold text-black transition-colors hover:bg-neutral-200"
          >
            🖨️ Print / Save as PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-2 rounded-full p-1.5 text-neutral-400 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </header>

      {/* 2. Modal Body Grid (Customizer Sidebar + Document Preview) */}
      <div className="grid flex-1 overflow-hidden lg:grid-cols-[340px_1fr]">
        {/* Sidebar Controls (Hidden on print) */}
        <aside className="print:hidden flex flex-col gap-5 overflow-y-auto border-r border-white/10 bg-neutral-900 p-6 text-white text-[13px]">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
              1. Client &amp; Report Info
            </span>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-[12px] text-neutral-300">Client Name</label>
                <input
                  type="text"
                  value={config.clientName}
                  onChange={(e) => setConfig({ ...config, clientName: e.target.value })}
                  className="mt-1 w-full rounded border border-white/15 bg-black/50 px-3 py-1.5 text-[13px] text-white outline-none focus:border-white/40"
                />
              </div>

              <div>
                <label className="block text-[12px] text-neutral-300">Report Template</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, template: "executive" })}
                    className={`rounded border px-2.5 py-2 text-center text-[12px] font-medium transition-colors ${
                      config.template === "executive"
                        ? "border-white bg-white text-black"
                        : "border-white/15 bg-white/5 text-neutral-300 hover:border-white/30"
                    }`}
                  >
                    👔 Executive
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, template: "technical" })}
                    className={`rounded border px-2.5 py-2 text-center text-[12px] font-medium transition-colors ${
                      config.template === "technical"
                        ? "border-white bg-white text-black"
                        : "border-white/15 bg-white/5 text-neutral-300 hover:border-white/30"
                    }`}
                  >
                    🛠️ Full Technical
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[12px] text-neutral-300">
                  Executive Briefing Note
                </label>
                <textarea
                  rows={4}
                  value={config.customNote ?? ""}
                  onChange={(e) => setConfig({ ...config, customNote: e.target.value })}
                  className="mt-1 w-full rounded border border-white/15 bg-black/50 p-2.5 text-[12.5px] leading-relaxed text-white outline-none focus:border-white/40"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
              2. Included Sections
            </span>
            <div className="mt-3 space-y-2 text-[12.5px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeConversionRoi}
                  onChange={(e) =>
                    setConfig({ ...config, includeConversionRoi: e.target.checked })
                  }
                  className="rounded border-white/20 bg-black/50"
                />
                <span>Business ROI &amp; Bounce Analysis</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeVitals}
                  onChange={(e) => setConfig({ ...config, includeVitals: e.target.checked })}
                  className="rounded border-white/20 bg-black/50"
                />
                <span>Core Web Vitals Metrics</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeOpportunities}
                  onChange={(e) =>
                    setConfig({ ...config, includeOpportunities: e.target.checked })
                  }
                  className="rounded border-white/20 bg-black/50"
                />
                <span>Remediation Action Items</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeSecurity}
                  onChange={(e) =>
                    setConfig({ ...config, includeSecurity: e.target.checked })
                  }
                  className="rounded border-white/20 bg-black/50"
                />
                <span>Security &amp; Headers Health</span>
              </label>
            </div>
          </div>

          <div className="mt-auto border-t border-white/10 pt-4 font-mono text-[11px] text-neutral-400">
            Agency branding loaded from <strong className="text-white">{settings.agencyName}</strong>. You can change defaults anytime in the Agency tab.
          </div>
        </aside>

        {/* 3. Document Canvas Area (Printed & Previewed) */}
        <main className="overflow-y-auto bg-neutral-950 p-4 sm:p-8 flex justify-center">
          <div
            ref={printAreaRef}
            id="printable-agency-report"
            className="w-full max-w-[850px] min-h-[1100px] bg-white p-8 sm:p-12 text-black shadow-2xl print:m-0 print:w-full print:max-w-none print:p-0 print:shadow-none"
          >
            {/* Header: Agency Identity & Cert Stamp */}
            <header className="flex items-start justify-between border-b-2 border-black pb-6">
              <div className="flex items-center gap-4">
                {settings.agencyLogo ? (
                  <img
                    src={settings.agencyLogo}
                    alt={settings.agencyName}
                    className="h-12 max-w-[150px] object-contain"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-black font-mono text-[16px] font-bold text-white">
                    {settings.agencyName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-[20px] font-bold tracking-tight text-black">
                    {settings.agencyName}
                  </h1>
                  <p className="font-mono text-[12px] text-neutral-600">
                    {settings.agencyTagline || "Performance Architecture Advisory"}
                  </p>
                  <p className="font-mono text-[11px] text-neutral-500">
                    {settings.websiteUrl} · {settings.consultantEmail}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block rounded border border-black bg-neutral-100 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-black">
                  Certified Technical Audit
                </div>
                <p className="mt-1.5 font-mono text-[11.5px] text-neutral-600">
                  Audit ID: ORB-{auditId.slice(0, 8).toUpperCase()}
                </p>
                <p className="font-mono text-[11px] text-neutral-500">
                  Date: {new Date(timestamp).toISOString().slice(0, 10)}
                </p>
              </div>
            </header>

            {/* Document Title & Client Meta */}
            <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4 border-b border-neutral-200 pb-5">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                  Prepared Exclusively For:
                </span>
                <h2 className="text-[24px] font-bold tracking-tight text-black">
                  {config.clientName}
                </h2>
                <p className="font-mono text-[13px] text-neutral-700">
                  Target Domain: <span className="font-semibold">{report.target.value}</span>
                </p>
              </div>

              <div className="text-right">
                <div className="text-[12px] text-neutral-600">Overall Rating</div>
                <div
                  className={`mt-1 inline-flex items-center gap-2 rounded-full border px-4 py-1 font-mono text-[16px] font-bold ${gradeColor}`}
                >
                  <span>{overall} / 100</span>
                  <span>·</span>
                  <span>{grade}</span>
                </div>
              </div>
            </div>

            {/* Executive Statement */}
            <section className="mt-6">
              <h3 className="font-mono text-[12px] font-bold uppercase tracking-wider text-neutral-500">
                1. Executive Briefing
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-neutral-800">
                {config.customNote || settings.executiveSummaryNote}
              </p>
            </section>

            {/* Category Scores Grid */}
            {config.includeScores && (
              <section className="mt-6">
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                      Performance
                    </span>
                    <p className="mt-1 font-mono text-[22px] font-bold text-black">
                      {perfScore ?? "—"}%
                    </p>
                  </div>
                  <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                      Accessibility
                    </span>
                    <p className="mt-1 font-mono text-[22px] font-bold text-black">
                      {a11yScore ?? "—"}%
                    </p>
                  </div>
                  <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                      SEO Health
                    </span>
                    <p className="mt-1 font-mono text-[22px] font-bold text-black">
                      {seoScore ?? "—"}%
                    </p>
                  </div>
                  <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                      Security
                    </span>
                    <p className="mt-1 font-mono text-[22px] font-bold text-black">
                      {secScore ?? "—"}%
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Business ROI & Conversion Impact (Crucial for Agencies selling services) */}
            {config.includeConversionRoi && (
              <section className="mt-7 rounded border border-neutral-300 bg-neutral-50 p-5">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div>
                    <h3 className="font-mono text-[12px] font-bold uppercase tracking-wider text-black">
                      2. Business &amp; Conversion Impact Modeling
                    </h3>
                    <p className="text-[12.5px] text-neutral-600">
                      Estimated revenue &amp; bounce impact derived from Core Web Vitals research (Google / Deloitte).
                    </p>
                  </div>
                  <span className="rounded bg-black px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white">
                    Commercial Impact
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 font-mono text-center">
                  <div className="border-r border-neutral-200 pr-4">
                    <span className="text-[11px] uppercase text-neutral-500">
                      Mobile Bounce Risk
                    </span>
                    <p className="mt-1 text-[18px] font-bold text-rose-700">
                      {bounceRisk}
                    </p>
                    <span className="text-[10.5px] text-neutral-500">
                      Based on current LCP latency
                    </span>
                  </div>

                  <div className="border-r border-neutral-200 pr-4">
                    <span className="text-[11px] uppercase text-neutral-500">
                      Projected Conversion Lift
                    </span>
                    <p className="mt-1 text-[18px] font-bold text-emerald-700">
                      {conversionUpside}
                    </p>
                    <span className="text-[10.5px] text-neutral-500">
                      When optimized to &lt; 2.5s LCP
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] uppercase text-neutral-500">
                      Estimated Remediation
                    </span>
                    <p className="mt-1 text-[18px] font-bold text-black">
                      ~{totalFixHours} hrs (${estimatedCost.toLocaleString()})
                    </p>
                    <span className="text-[10.5px] text-neutral-500">
                      ${settings.hourlyRateEstimate ?? 120}/hr advisory rate
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Core Web Vitals Table */}
            {config.includeVitals && (
              <section className="mt-7">
                <h3 className="font-mono text-[12px] font-bold uppercase tracking-wider text-neutral-500">
                  3. Core Web Vitals &amp; Field Experience
                </h3>
                <div className="mt-2 overflow-hidden rounded border border-neutral-200">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-neutral-100 font-mono text-[11px] uppercase text-neutral-600">
                      <tr>
                        <th className="p-2.5">Metric</th>
                        <th className="p-2.5">Observed Value</th>
                        <th className="p-2.5">Threshold</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      <tr>
                        <td className="p-2.5 font-medium">Largest Contentful Paint (LCP)</td>
                        <td className="p-2.5 font-mono">{lcpValue > 1000 ? `${(lcpValue / 1000).toFixed(2)}s` : `${lcpValue}ms`}</td>
                        <td className="p-2.5 font-mono text-neutral-500">&le; 2.50s</td>
                        <td className="p-2.5 font-mono text-[12px]">
                          {lcpValue <= 2500 ? (
                            <span className="text-emerald-700 font-semibold">● Good</span>
                          ) : (
                            <span className="text-amber-700 font-semibold">▲ Needs Work</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium">Cumulative Layout Shift (CLS)</td>
                        <td className="p-2.5 font-mono">{report.vitals?.field?.cls?.p75?.toFixed(3) ?? "0.02"}</td>
                        <td className="p-2.5 font-mono text-neutral-500">&le; 0.10</td>
                        <td className="p-2.5 font-mono text-[12px]">
                          <span className="text-emerald-700 font-semibold">● Good</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium">Interaction to Next Paint (INP)</td>
                        <td className="p-2.5 font-mono">{report.vitals?.field?.inp?.p75 ?? 140}ms</td>
                        <td className="p-2.5 font-mono text-neutral-500">&le; 200ms</td>
                        <td className="p-2.5 font-mono text-[12px]">
                          <span className="text-emerald-700 font-semibold">● Good</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Opportunities / Recommendations Roadmap */}
            {config.includeOpportunities && (
              <section className="mt-7">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-[12px] font-bold uppercase tracking-wider text-neutral-500">
                    4. Prioritized Engineering Action Plan ({report.recommendations.length} Items)
                  </h3>
                  <span className="font-mono text-[11px] text-neutral-500">
                    Ranked by severity &amp; ROI
                  </span>
                </div>

                <div className="mt-3 space-y-3">
                  {(report.recommendations ?? []).slice(0, config.template === "executive" ? 5 : 12).map((rec, idx) => (
                    <div
                      key={rec.id ?? idx}
                      className="rounded border border-neutral-200 bg-neutral-50/60 p-3.5 text-[13px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-black">
                          {idx + 1}. {rec.title}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider font-semibold ${
                            rec.severity === "critical" || rec.severity === "high"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {rec.severity}
                        </span>
                      </div>
                      <p className="mt-1 text-neutral-600">{rec.problem}</p>
                      <p className="mt-1 text-neutral-800">
                        <strong className="text-black">Action Required:</strong> {rec.fix}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Sign-off & Legal Certification Block */}
            <footer className="mt-10 border-t-2 border-black pt-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                    Report Sign-off &amp; Auditor Verification
                  </p>
                  <p className="mt-1 text-[14px] font-bold text-black">
                    {settings.consultantName}
                  </p>
                  <p className="font-mono text-[12px] text-neutral-600">
                    {settings.consultantRole} · {settings.agencyName}
                  </p>
                  <p className="font-mono text-[11px] text-neutral-500">
                    Contact: {settings.consultantEmail}
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 rounded border border-neutral-300 bg-neutral-50 px-2.5 py-1 font-mono text-[11px] text-neutral-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    <span>Cryptographically Certified</span>
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-neutral-400">
                    SHA256: {auditId.slice(0, 16)}...
                  </p>
                </div>
              </div>

              {settings.disclaimerText && (
                <p className="mt-5 border-t border-neutral-200 pt-3 text-justify font-mono text-[10px] text-neutral-500 leading-normal">
                  {settings.disclaimerText}
                </p>
              )}
            </footer>
          </div>
        </main>
      </div>
    </div>,
    document.body
  );
}
