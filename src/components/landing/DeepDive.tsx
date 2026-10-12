import { Reveal } from "./Reveal";

/* Ikona listy — powtarzalny „check" ze świata deep-list. */
function Check() {
  return (
    <svg className="mt-[2px] h-[18px] w-[18px] flex-none text-ink" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}

const DEEP_CLASS =
  "grid grid-cols-2 items-center gap-[clamp(40px,6vw,80px)] max-[920px]:grid-cols-1 max-[920px]:gap-9";
const H3_CLASS = "text-[clamp(24px,3vw,33px)] font-semibold leading-[1.12] tracking-[-0.02em]";
const DEEP_LEAD_CLASS = "mt-4 max-w-[56ch] text-[clamp(16px,1.3vw,18px)] leading-[1.6] text-gray-1";
const LIST_CLASS = "mt-6 flex flex-col gap-[13px]";
const LI_CLASS = "flex items-start gap-3 text-[15px] text-gray-1";
const PANEL_CLASS = "w-full max-w-full overflow-hidden rounded-[8px] border border-line bg-white";
const HEAD_CLASS =
  "flex items-center justify-between border-b border-line px-3.5 sm:px-5 py-3 sm:py-[15px] font-mono text-[11px] sm:text-[11.5px] uppercase tracking-[0.05em] text-muted";
const ISSUE_CLASS =
  "grid grid-cols-[46px_minmax(0,1fr)_auto] sm:grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-2.5 sm:gap-4 border-b border-line-2 px-3 sm:px-5 py-3 sm:py-[14px] font-mono text-[12px] sm:text-[13px] transition-colors duration-150 last:border-b-0 hover:bg-bg-soft";
const PRIO_BASE = "rounded-[4px] border px-0 py-[3px] text-center text-[9.5px] uppercase tracking-[0.05em]";
const RUN_CLASS =
  "grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2.5 sm:gap-4 border-b border-line-2 px-3 sm:px-5 py-3 sm:py-[15px] font-mono text-[12px] sm:text-[13px] transition-colors duration-150 last:border-b-0 hover:bg-bg-soft";

export function DeepDive() {
  return (
    <section className="py-[clamp(52px,6.5vw,92px)]" id="report">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-[clamp(24px,5vw,40px)]">
        <Reveal className="mb-[clamp(30px,3.8vw,48px)] max-w-[660px]">
          <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Inside the report</span>
          <h2 className="mt-4 text-[clamp(30px,4vw,46px)] font-semibold leading-[1.08] tracking-[-0.025em]">Not just a score. A plan.</h2>
          <p className="mt-[18px] max-w-[56ch] text-[clamp(16px,1.3vw,18px)] leading-[1.6] text-gray-1">
            A number tells you where you stand. Orbital tells you what to do
            next — every finding tied to a fix, and every fix tied to the points
            it returns.
          </p>
        </Reveal>

        <Reveal className={DEEP_CLASS}>
          <div>
            <h3 className={H3_CLASS}>Every issue, ranked by impact</h3>
            <p className={DEEP_LEAD_CLASS}>
              Orbital doesn&apos;t dump two hundred warnings on you. It surfaces
              what actually moves your score, ordered by the points each fix
              returns versus the time it takes.
            </p>
            <ul className={LIST_CLASS}>
              <li className={LI_CLASS}>
                <Check />
                Prioritized by score impact, not severity noise
              </li>
              <li className={LI_CLASS}>
                <Check />
                Deep-links to the exact DOM node or request
              </li>
              <li className={LI_CLASS}>
                <Check />
                Copy-ready remediation snippets for each finding
              </li>
            </ul>
          </div>
          <div>
            <div className={PANEL_CLASS}>
              <div className={HEAD_CLASS}>
                <span>12 opportunities</span>
                <span>Sorted by impact</span>
              </div>
              <div className={ISSUE_CLASS}>
                <span className={`${PRIO_BASE} border-ink text-ink`}>High</span>
                <span className="truncate min-w-0 text-ink-2">Serve images in next-gen formats</span>
                <span className="text-right text-muted">+8 pts</span>
              </div>
              <div className={ISSUE_CLASS}>
                <span className={`${PRIO_BASE} border-ink text-ink`}>High</span>
                <span className="truncate min-w-0 text-ink-2">Eliminate render-blocking CSS</span>
                <span className="text-right text-muted">+6 pts</span>
              </div>
              <div className={ISSUE_CLASS}>
                <span className={`${PRIO_BASE} border-muted text-gray-1`}>Med</span>
                <span className="truncate min-w-0 text-ink-2">Set explicit width &amp; height on media</span>
                <span className="text-right text-muted">+3 pts</span>
              </div>
              <div className={ISSUE_CLASS}>
                <span className={`${PRIO_BASE} border-muted text-gray-1`}>Med</span>
                <span className="truncate min-w-0 text-ink-2">Reduce unused JavaScript</span>
                <span className="text-right text-muted">+3 pts</span>
              </div>
              <div className={ISSUE_CLASS}>
                <span className={`${PRIO_BASE} border-line text-muted`}>Low</span>
                <span className="truncate min-w-0 text-ink-2">Enable text compression</span>
                <span className="text-right text-muted">+1 pt</span>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className={`${DEEP_CLASS} mt-[clamp(44px,5.5vw,76px)]`}>
          <div className="order-2 max-[920px]:order-none">
            <h3 className={H3_CLASS}>Watch the score move over time</h3>
            <p className={DEEP_LEAD_CLASS}>
              Re-run on every deploy. Orbital keeps a full history for each URL,
              so you can prove a regression — or a win — to the rest of the team.
            </p>
            <ul className={LIST_CLASS}>
              <li className={LI_CLASS}>
                <Check />
                Automatic re-audits on a schedule you set
              </li>
              <li className={LI_CLASS}>
                <Check />
                Diff any two runs, field by field
              </li>
              <li className={LI_CLASS}>
                <Check />
                Slack and webhook alerts the moment a score drops
              </li>
            </ul>
          </div>
          <div>
            <div className={PANEL_CLASS}>
              <div className={HEAD_CLASS}>
                <span>yoursite.com</span>
                <span>Last 5 runs</span>
              </div>
              <div className={RUN_CLASS}>
                <span className="text-muted flex-none">Sep 26</span>
                <span className="h-[5px] min-w-0 overflow-hidden rounded-full bg-line"><span className="block h-full rounded-full bg-ink" style={{ width: "97%" }} /></span>
                <span className="font-medium text-ink flex-none">97</span>
                <span className="min-w-[40px] sm:min-w-[52px] text-right text-muted flex-none">▲ +4</span>
              </div>
              <div className={RUN_CLASS}>
                <span className="text-muted flex-none">Sep 19</span>
                <span className="h-[5px] min-w-0 overflow-hidden rounded-full bg-line"><span className="block h-full rounded-full bg-ink" style={{ width: "93%" }} /></span>
                <span className="font-medium text-ink flex-none">93</span>
                <span className="min-w-[40px] sm:min-w-[52px] text-right text-muted flex-none">▲ +2</span>
              </div>
              <div className={RUN_CLASS}>
                <span className="text-muted flex-none">Sep 12</span>
                <span className="h-[5px] min-w-0 overflow-hidden rounded-full bg-line"><span className="block h-full rounded-full bg-ink" style={{ width: "91%" }} /></span>
                <span className="font-medium text-ink flex-none">91</span>
                <span className="min-w-[40px] sm:min-w-[52px] text-right text-muted flex-none">▼ −1</span>
              </div>
              <div className={RUN_CLASS}>
                <span className="text-muted flex-none">Sep 05</span>
                <span className="h-[5px] min-w-0 overflow-hidden rounded-full bg-line"><span className="block h-full rounded-full bg-ink" style={{ width: "92%" }} /></span>
                <span className="font-medium text-ink flex-none">92</span>
                <span className="min-w-[40px] sm:min-w-[52px] text-right text-muted flex-none">▲ +7</span>
              </div>
              <div className={RUN_CLASS}>
                <span className="text-muted flex-none">Aug 29</span>
                <span className="h-[5px] min-w-0 overflow-hidden rounded-full bg-line"><span className="block h-full rounded-full bg-ink" style={{ width: "85%" }} /></span>
                <span className="font-medium text-ink flex-none">85</span>
                <span className="min-w-[40px] sm:min-w-[52px] text-right text-muted flex-none">—</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
