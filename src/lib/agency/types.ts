export interface AgencySettings {
  agencyName: string;
  agencyTagline?: string;
  agencyLogo?: string;
  consultantName: string;
  consultantRole?: string;
  consultantEmail?: string;
  websiteUrl?: string;
  executiveSummaryNote?: string;
  brandAccentColor?: string;
  disclaimerText?: string;
  hourlyRateEstimate?: number;
}

export interface ClientReportConfig {
  clientName: string;
  reportTitle?: string;
  template: "executive" | "technical" | "full";
  includeScores: boolean;
  includeOpportunities: boolean;
  includeVitals: boolean;
  includeSecurity: boolean;
  includeConversionRoi: boolean;
  customNote?: string;
}

export const DEFAULT_AGENCY_SETTINGS: AgencySettings = {
  agencyName: "Orbital Partner Engineering",
  agencyTagline: "Performance Architecture & Web Engineering Advisory",
  consultantName: "Lead Web Architect",
  consultantRole: "Senior Performance Engineer",
  consultantEmail: "advisory@orbital.dev",
  websiteUrl: "https://orbital.dev",
  executiveSummaryNote:
    "This technical health assessment was conducted using rigorous lab emulation and real-user data. It evaluates performance bottlenecks, Core Web Vitals compliance, security posture, and search engine readiness. Below is our prioritized remediation roadmap to maximize user conversion and search visibility.",
  brandAccentColor: "#0a0a0a",
  disclaimerText:
    "Confidential client audit. All measurements recorded using Lighthouse 12 synthetic emulation and Chrome UX Report (CrUX) field telemetry. Recommendations are prioritized based on estimated business ROI and engineering effort.",
  hourlyRateEstimate: 120,
};
