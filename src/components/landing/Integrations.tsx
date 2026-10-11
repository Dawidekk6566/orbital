"use client";

import { useRef, useState } from "react";
import { Reveal } from "./Reveal";

/* ============================================================
   INTEGRATIONS — zakładki kodu (CLI / GitHub Action / REST API)
   z kopiowaniem zawartości aktywnego panelu. 1:1 z HTML.
   ============================================================ */

type Tab = "cli" | "ci" | "api";

const TABS: { id: Tab; label: string }[] = [
  { id: "cli", label: "CLI" },
  { id: "ci", label: "GitHub Action" },
  { id: "api", label: "REST API" },
];

const TAB_BASE =
  "rounded-t-[6px] px-4 py-2.5 font-mono text-[13px] transition-[color,background] duration-150";
const PRE_CLASS = "whitespace-pre font-mono text-[13.5px] leading-[1.75] text-[#e6e6e6]";

export function Integrations() {
  const [current, setCurrent] = useState<Tab>("cli");
  const [copied, setCopied] = useState(false);
  const surface = useRef<HTMLDivElement>(null);

  function copy() {
    const panel = surface.current?.querySelector(
      `[data-code-panel="${current}"]`,
    );
    const text = panel?.textContent ?? "";
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* noop */
      }
      document.body.removeChild(ta);
      done();
    }
  }

  return (
    <section className="py-[clamp(52px,6.5vw,92px)]" id="integrations">
      <div className="mx-auto max-w-[1200px] px-[clamp(24px,5vw,40px)]">
        <Reveal className="mb-[clamp(30px,3.8vw,48px)] max-w-[660px]">
          <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Integrations</span>
          <h2 className="mt-4 text-[clamp(30px,4vw,46px)] font-semibold leading-[1.08] tracking-[-0.025em]">Runs where your code already lives.</h2>
          <p className="mt-[18px] max-w-[56ch] text-[clamp(16px,1.3vw,18px)] leading-[1.6] text-gray-1">
            One command locally, one job in CI, one endpoint for everything
            else. Orbital fails the build when a score drops below your budget.
          </p>
        </Reveal>
        <Reveal>
          <div className="flex flex-wrap items-center gap-1 rounded-t-[8px] border border-b-0 border-line bg-white px-2 pt-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`${TAB_BASE} ${
                  current === tab.id ? "bg-ink text-white" : "text-muted hover:text-ink"
                }`}
                aria-pressed={current === tab.id}
                onClick={() => setCurrent(tab.id)}
              >
                {tab.label}
              </button>
            ))}
            <button
              type="button"
              className="mb-2 ml-auto self-center rounded-[6px] border border-line px-[13px] py-[7px] font-mono text-[12px] text-muted transition-[border-color,color] duration-150 hover:border-ink hover:text-ink"
              onClick={copy}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="theme-fixed overflow-x-auto rounded-b-[8px] bg-ink p-[clamp(20px,2.5vw,28px)]" ref={surface}>
            <pre className={PRE_CLASS} data-code-panel="cli" hidden={current !== "cli"}>
              <span className="text-[#888]">{`# install once`}</span>
              {`
npm i -g @orbital/cli

`}
              <span className="text-[#888]">{`# audit any URL, fail under budget`}</span>
              {`
orbital audit https://acme.store \\
  --budget perf=90,a11y=100,seo=95 \\
  --format table`}
            </pre>
            <pre className={PRE_CLASS} data-code-panel="ci" hidden={current !== "ci"}>
              <span className="text-[#888]">{`# .github/workflows/audit.yml`}</span>
              {`
name: Orbital
`}
              <span className="text-[#b0b0b0]">{`on:`}</span>
              {` [push]
`}
              <span className="text-[#b0b0b0]">{`jobs:`}</span>
              {`
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: orbital/audit-action@v2
        with:
          url: https://acme.store
          budget: perf=90,a11y=100`}
            </pre>
            <pre className={PRE_CLASS} data-code-panel="api" hidden={current !== "api"}>
              <span className="text-[#888]">{`// POST an audit, poll for the report`}</span>
              {`
curl -X POST https://api.orbital.dev/v1/audits \\
  -H "Authorization: Bearer $ORBITAL_KEY" \\
  -d '{ "url": "https://acme.store" }'

`}
              <span className="text-[#888]">{`// → { "id": "aud_9f2", "score": 97, ... }`}</span>
            </pre>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
