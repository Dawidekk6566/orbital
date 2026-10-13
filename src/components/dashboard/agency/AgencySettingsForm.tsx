"use client";

import { useState } from "react";
import { useAgencySettings } from "@/lib/agency/storage";
import type { AgencySettings } from "@/lib/agency/types";

export function AgencySettingsForm() {
  const { settings, update, reset, mounted } = useAgencySettings();
  const [form, setForm] = useState<AgencySettings>(settings);
  const [saved, setSaved] = useState(false);

  // Sync when mounted loads from storage
  if (mounted && form.agencyName === "Orbital Partner Engineering" && settings.agencyName !== "Orbital Partner Engineering") {
    setForm(settings);
  }

  const handleChange = (key: keyof AgencySettings, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    reset();
    setForm(settings);
  };

  if (!mounted) {
    return (
      <div className="flex h-48 items-center justify-center font-mono text-[13px] text-muted">
        Loading Agency Configuration…
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      {/* 1. Form Section */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="rounded-[10px] border border-line bg-white/95 p-6 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5">
          <div className="border-b border-line pb-3">
            <h2 className="text-[16px] font-semibold text-ink">
              Agency &amp; Consultancy Identity
            </h2>
            <p className="text-[13px] text-muted">
              These details appear on generated client PDFs, executive briefings, and shared reports.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
                Agency / Studio Name
              </label>
              <input
                type="text"
                value={form.agencyName}
                onChange={(e) => handleChange("agencyName", e.target.value)}
                placeholder="e.g. Apex Digital Architecture"
                className="mt-1.5 w-full rounded-[6px] border border-line bg-bg-soft px-3 py-2 text-[14px] text-ink outline-none transition-colors focus:border-ink"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
                Agency Tagline
              </label>
              <input
                type="text"
                value={form.agencyTagline ?? ""}
                onChange={(e) => handleChange("agencyTagline", e.target.value)}
                placeholder="e.g. Performance Engineering Advisory"
                className="mt-1.5 w-full rounded-[6px] border border-line bg-bg-soft px-3 py-2 text-[14px] text-ink outline-none transition-colors focus:border-ink"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
                Lead Auditor / Consultant
              </label>
              <input
                type="text"
                value={form.consultantName}
                onChange={(e) => handleChange("consultantName", e.target.value)}
                placeholder="e.g. Dawid (Lead Architect)"
                className="mt-1.5 w-full rounded-[6px] border border-line bg-bg-soft px-3 py-2 text-[14px] text-ink outline-none transition-colors focus:border-ink"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
                Consultant Role / Title
              </label>
              <input
                type="text"
                value={form.consultantRole ?? ""}
                onChange={(e) => handleChange("consultantRole", e.target.value)}
                placeholder="e.g. Senior Frontend Architect"
                className="mt-1.5 w-full rounded-[6px] border border-line bg-bg-soft px-3 py-2 text-[14px] text-ink outline-none transition-colors focus:border-ink"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
                Contact Email
              </label>
              <input
                type="email"
                value={form.consultantEmail ?? ""}
                onChange={(e) => handleChange("consultantEmail", e.target.value)}
                placeholder="advisory@your-agency.com"
                className="mt-1.5 w-full rounded-[6px] border border-line bg-bg-soft px-3 py-2 text-[14px] text-ink outline-none transition-colors focus:border-ink"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
                Agency Website URL
              </label>
              <input
                type="url"
                value={form.websiteUrl ?? ""}
                onChange={(e) => handleChange("websiteUrl", e.target.value)}
                placeholder="https://your-agency.com"
                className="mt-1.5 w-full rounded-[6px] border border-line bg-bg-soft px-3 py-2 text-[14px] text-ink outline-none transition-colors focus:border-ink"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
                Agency Logo URL (Optional)
              </label>
              <input
                type="url"
                value={form.agencyLogo ?? ""}
                onChange={(e) => handleChange("agencyLogo", e.target.value)}
                placeholder="https://example.com/logo.png"
                className="mt-1.5 w-full rounded-[6px] border border-line bg-bg-soft px-3 py-2 text-[14px] text-ink outline-none transition-colors focus:border-ink"
              />
              <span className="mt-1 block text-[12px] text-muted">
                Leave blank to render an elegant Swiss typographical monogram in the header.
              </span>
            </div>
          </div>
        </div>

        {/* 2. Executive Briefing & Commercials */}
        <div className="rounded-[10px] border border-line bg-white/95 p-6 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5">
          <div className="border-b border-line pb-3">
            <h2 className="text-[16px] font-semibold text-ink">
              Executive Briefing &amp; Commercials
            </h2>
            <p className="text-[13px] text-muted">
              Customize the default message seen by C-level executives in exported reports.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
                Default Executive Summary Statement
              </label>
              <textarea
                rows={3}
                value={form.executiveSummaryNote ?? ""}
                onChange={(e) => handleChange("executiveSummaryNote", e.target.value)}
                className="mt-1.5 w-full rounded-[6px] border border-line bg-bg-soft p-3 font-sans text-[13.5px] leading-relaxed text-ink outline-none transition-colors focus:border-ink"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
                  Client Engineering Rate ($/hr)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={form.hourlyRateEstimate ?? 120}
                  onChange={(e) => handleChange("hourlyRateEstimate", Number(e.target.value))}
                  className="mt-1.5 w-full rounded-[6px] border border-line bg-bg-soft px-3 py-2 font-mono text-[14px] text-ink outline-none transition-colors focus:border-ink"
                />
                <span className="mt-1 block text-[11.5px] text-muted">
                  Used to estimate savings &amp; remediation effort for clients.
                </span>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
                  Brand Accent
                </label>
                <div className="mt-1.5 flex items-center gap-2.5">
                  <input
                    type="color"
                    value={form.brandAccentColor ?? "#0a0a0a"}
                    onChange={(e) => handleChange("brandAccentColor", e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-line bg-transparent p-0.5"
                  />
                  <span className="font-mono text-[13px] text-muted">
                    {form.brandAccentColor ?? "#0a0a0a"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
                Custom Legal Disclaimer &amp; Sign-off
              </label>
              <textarea
                rows={2}
                value={form.disclaimerText ?? ""}
                onChange={(e) => handleChange("disclaimerText", e.target.value)}
                className="mt-1.5 w-full rounded-[6px] border border-line bg-bg-soft p-3 font-mono text-[12px] text-ink outline-none transition-colors focus:border-ink"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="text-[13px] text-muted underline underline-offset-4 hover:text-ink"
            >
              Reset to defaults
            </button>
            <div className="flex items-center gap-3">
              {saved && (
                <span className="font-mono text-[12px] text-good">
                  ✓ Settings saved
                </span>
              )}
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#222]"
              >
                Save Agency Profile
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* 2. Real-Time Live Preview of Agency Header & Certificate */}
      <div className="flex flex-col gap-6">
        <div className="sticky top-24 rounded-[10px] border border-line bg-white/95 p-6 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="text-[14px] font-semibold text-ink">
                Live Client Report Preview
              </h3>
              <p className="text-[12px] text-muted">
                Preview of how your branding renders on exported A4 PDFs.
              </p>
            </div>
            <span className="rounded border border-line bg-bg-soft px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wider text-muted">
              Swiss A4
            </span>
          </div>

          {/* Simulated Printed Header */}
          <div className="mt-5 rounded-[8px] border border-line-2 bg-white p-5 text-black shadow-sm">
            <div className="flex items-start justify-between border-b border-black/10 pb-4">
              <div className="flex items-center gap-3">
                {form.agencyLogo ? (
                  <img
                    src={form.agencyLogo}
                    alt={form.agencyName}
                    className="h-10 max-w-[120px] object-contain"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded border border-black/20 bg-black font-mono text-[14px] font-bold text-white">
                    {form.agencyName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-[15px] font-bold tracking-tight text-black">
                    {form.agencyName || "Agency Name"}
                  </h4>
                  <p className="font-mono text-[11px] text-black/60">
                    {form.agencyTagline || "Performance Engineering Advisory"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="rounded bg-black/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-black/80">
                  Certified Audit
                </span>
                <p className="mt-1 font-mono text-[10.5px] text-black/50">
                  Ref: ORB-CLIENT-2026
                </p>
              </div>
            </div>

            {/* Simulated Body */}
            <div className="mt-4 space-y-3">
              <div className="rounded border border-black/10 bg-neutral-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-black/60">
                    Audit Subject
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-black">
                    https://client-domain.com
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-black/5 pt-2">
                  <span className="text-[12px] text-black/70">Overall Health Score</span>
                  <span className="font-mono text-[15px] font-bold text-emerald-600">
                    94 / 100 (Grade A)
                  </span>
                </div>
              </div>

              <div className="text-[12px] leading-relaxed text-black/70">
                <strong className="text-black">Executive Statement: </strong>
                {form.executiveSummaryNote ? (
                  <span>
                    {form.executiveSummaryNote.slice(0, 160)}
                    {form.executiveSummaryNote.length > 160 ? "…" : ""}
                  </span>
                ) : (
                  "Performance and security evaluation prepared for executive stakeholders."
                )}
              </div>

              {/* Auditor Sign-off */}
              <div className="mt-4 flex items-end justify-between border-t border-black/10 pt-3 font-mono text-[11px] text-black/60">
                <div>
                  <p className="font-semibold text-black">{form.consultantName}</p>
                  <p className="text-[10px]">{form.consultantRole}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-emerald-600">● Verification Verified</p>
                  <p className="text-[9px] text-black/40">Timestamp: 2026-10-13</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[6px] border border-line bg-bg-soft/50 p-3 font-mono text-[11.5px] text-muted">
            💡 <span className="text-ink font-medium">Tip:</span> Once configured, go to any completed audit in your History or Projects and click <strong className="text-ink">Export Branded PDF</strong> to generate instant client deliverables.
          </div>
        </div>
      </div>
    </div>
  );
}
