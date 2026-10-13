import Anthropic from "@anthropic-ai/sdk";
import type { RemediationRequest, RemediationResult } from "./remediationTypes";

const MODEL = process.env.ANALYSIS_MODEL ?? "claude-sonnet-5-5";

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

function getDeterministicPatch(req: RemediationRequest): RemediationResult {
  const t = req.title.toLowerCase();
  const c = req.category.toLowerCase();

  if (t.includes("image") || t.includes("lcp") || t.includes("picture") || t.includes("format")) {
    const filePath = "src/components/OptimizedImage.tsx";
    const beforeCode = req.codeSnippet?.bad ?? `<img src="/hero-banner.jpg" alt="Website Banner" />`;
    const afterCode =
      req.codeSnippet?.good ??
      `import Image from "next/image";

export function HeroBanner() {
  return (
    <Image
      src="/hero-banner.webp"
      alt="Website Banner"
      width={1200}
      height={630}
      priority
      sizes="(max-width: 768px) 100vw, 1200px"
      className="h-auto w-full object-cover"
    />
  );
}`;

    const diff = `--- a/${filePath}
+++ b/${filePath}
@@ -1,3 +1,13 @@
-<img src="/hero-banner.jpg" alt="Website Banner" />
+import Image from "next/image";
+
+export function HeroBanner() {
+  return (
+    <Image
+      src="/hero-banner.webp"
+      alt="Website Banner"
+      width={1200}
+      height={630}
+      priority
+      sizes="(max-width: 768px) 100vw, 1200px"
+      className="h-auto w-full object-cover"
+    />
+  );
+}`;

    return {
      issueId: req.issueId,
      title: req.title,
      filePath,
      framework: "Next.js 16 (App Router)",
      explanation:
        "Standard <img> elements lack automatic responsive srcset resolution, format conversion to AVIF/WebP, and fetch prioritization. Using next/image with 'priority' hints the browser's preload scanner to fetch the critical LCP asset immediately.",
      cwbImpact: "Reduces LCP by ~450ms–700ms and eliminates image-induced layout shifts (CLS: 0.00).",
      diff,
      beforeCode,
      afterCode,
      instructions: [
        "1. Replace standard <img> tag with Next.js next/image component.",
        "2. Add explicit width/height dimensions or fill mode to prevent Cumulative Layout Shift.",
        "3. Specify priority={true} if this image is above the fold.",
      ],
    };
  }

  if (c === "security" || t.includes("header") || t.includes("csp") || t.includes("hsts")) {
    const filePath = "src/middleware.ts";
    const beforeCode = `export function middleware(request: Request) {
  return NextResponse.next();
}`;
    const afterCode = `import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );

  return response;
}`;

    const diff = `--- a/${filePath}
+++ b/${filePath}
@@ -1,3 +1,18 @@
 export function middleware(request: Request) {
-  return NextResponse.next();
+  const response = NextResponse.next();
+
+  response.headers.set("X-Content-Type-Options", "nosniff");
+  response.headers.set("X-Frame-Options", "DENY");
+  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
+  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
+  response.headers.set(
+    "Strict-Transport-Security",
+    "max-age=63072000; includeSubDomains; preload"
+  );
+  response.headers.set(
+    "Content-Security-Policy",
+    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
+  );
+
+  return response;
 }`;

    return {
      issueId: req.issueId,
      title: req.title,
      filePath,
      framework: "Next.js Middleware",
      explanation:
        "Modern browsers rely on HTTP response security headers to enforce Strict Transport Security (HSTS), prevent clickjacking (X-Frame-Options), and stop MIME-sniffing and cross-site scripting (CSP).",
      cwbImpact: "Raises Security grade from C/D to A+, satisfying enterprise compliance standards.",
      diff,
      beforeCode,
      afterCode,
      instructions: [
        "1. Open or create src/middleware.ts.",
        "2. Add security headers to the NextResponse chain.",
        "3. Verify headers using curl -I or Orbital Security Inspector.",
      ],
    };
  }

  if (c === "accessibility" || t.includes("aria") || t.includes("alt") || t.includes("contrast")) {
    const filePath = "src/components/NavigationButton.tsx";
    const beforeCode = req.codeSnippet?.bad ?? `<button onClick={handleOpen}><svg>...</svg></button>`;
    const afterCode =
      req.codeSnippet?.good ??
      `<button
  type="button"
  onClick={handleOpen}
  aria-label="Toggle navigation menu"
  aria-expanded={isOpen}
  className="p-2 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
>
  <svg aria-hidden="true" focusable="false">...</svg>
</button>`;

    const diff = `--- a/${filePath}
+++ b/${filePath}
@@ -1,3 +1,10 @@
-<button onClick={handleOpen}><svg>...</svg></button>
+<button
+  type="button"
+  onClick={handleOpen}
+  aria-label="Toggle navigation menu"
+  aria-expanded={isOpen}
+  className="p-2 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
+>
+  <svg aria-hidden="true" focusable="false">...</svg>
+</button>`;

    return {
      issueId: req.issueId,
      title: req.title,
      filePath,
      framework: "React 19 / JSX",
      explanation:
        "Icon buttons without visible text must have an explicit aria-label or accessible text node. Missing labels make the interface invisible to screen readers, violating WCAG 2.2 AA.",
      cwbImpact: "Recovers 10–15 Accessibility points and satisfies WCAG 2.2 AA compliance.",
      diff,
      beforeCode,
      afterCode,
      instructions: [
        "1. Add aria-label and type='button' to interactive icon elements.",
        "2. Add aria-hidden='true' to decorative svg icons.",
        "3. Ensure focus-visible outline is maintained for keyboard accessibility.",
      ],
    };
  }

  // Generic performance / SEO fallback
  const filePath = "src/app/layout.tsx";
  const beforeCode = req.codeSnippet?.bad ?? `// Suboptimal resource loading`;
  const afterCode =
    req.codeSnippet?.good ??
    `// Optimized resource loading with preconnect and font-display swap`;

  const diff = `--- a/${filePath}
+++ b/${filePath}
@@ -10,3 +10,6 @@
- <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter" />
+ <link rel="preconnect" href="https://fonts.googleapis.com" />
+ <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
+ <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter&display=swap" />`;

  return {
    issueId: req.issueId,
    title: req.title,
    filePath,
    framework: "Next.js / TypeScript",
    explanation: req.problem,
    cwbImpact: "Directly improves Speed Index and Core Web Vitals responsiveness.",
    diff,
    beforeCode,
    afterCode,
    instructions: [
      `1. Apply fix: ${req.fix}`,
      "2. Verify changes with a local production build (next build && next start).",
      "3. Re-run Orbital audit to confirm resolution.",
    ],
  };
}

export async function generateRemediationPatch(
  req: RemediationRequest
): Promise<RemediationResult> {
  const client = getClient();
  if (!client) {
    return getDeterministicPatch(req);
  }

  const prompt = `You are a Principal Web Performance & Frontend Security Engineer.
Generate a precise, production-grade code remediation patch for the following audit finding:
Title: ${req.title}
Category: ${req.category}
Severity: ${req.severity}
Problem: ${req.problem}
Suggested Fix: ${req.fix}
Target URL: ${req.targetUrl ?? "Web application"}

Respond ONLY with valid JSON matching this schema (no markdown code fences around JSON):
{
  "filePath": "relative/path/to/affected/file.tsx",
  "framework": "Next.js 16 / React 19",
  "explanation": "Clear explanation of why this happens and how the fix optimizes performance/security.",
  "cwbImpact": "e.g. Cuts LCP by ~400ms, eliminates 80ms Total Blocking Time",
  "diff": "Unified git diff format starting with --- a/... +++ b/...",
  "beforeCode": "Original problematic code snippet",
  "afterCode": "Optimized replacement code snippet",
  "instructions": ["Step 1...", "Step 2...", "Step 3..."]
}`;

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    });

    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return getDeterministicPatch(req);
    const parsed = JSON.parse(match[0]);

    return {
      issueId: req.issueId,
      title: req.title,
      filePath: parsed.filePath || "src/components/OptimizedComponent.tsx",
      framework: parsed.framework || "Next.js 16",
      explanation: parsed.explanation || req.problem,
      cwbImpact: parsed.cwbImpact || "Improves Core Web Vitals and Page Experience.",
      diff: parsed.diff || getDeterministicPatch(req).diff,
      beforeCode: parsed.beforeCode || req.codeSnippet?.bad || "// Previous code",
      afterCode: parsed.afterCode || req.codeSnippet?.good || "// Remediation code",
      instructions: Array.isArray(parsed.instructions)
        ? parsed.instructions
        : ["Apply suggested modifications to target file."],
    };
  } catch {
    return getDeterministicPatch(req);
  }
}
