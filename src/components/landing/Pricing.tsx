import { Reveal } from "./Reveal";

/* ============================================================
   PRICING — macierz planów Free / Pro / Team. 1:1 z HTML.
   ============================================================ */

const TH_BASE = "border-b border-ink px-[22px] pt-4 pb-[22px] align-bottom";
const TH_FEAT = `${TH_BASE} text-left w-[36%]`;
const TH_COL = `${TH_BASE} text-center w-[16%]`;
const TD_BASE = "border-b border-line px-[22px] py-4 align-middle";
const TD_FEAT = `${TD_BASE} text-left text-ink-2`;
const TD_VAL = `${TD_BASE} w-[16%] text-center font-mono text-[13.5px] text-gray-1`;
const TD_VAL_DASH = `${TD_BASE} w-[16%] text-center font-mono text-[13.5px] text-faint`;
const TD_CELL = `${TD_BASE} w-[16%] text-center`;
const PLAN_CLASS = "font-semibold text-[19px] tracking-[-0.01em] text-ink";
const PRICE_CLASS = "mt-[7px] block font-mono text-[13px] font-normal text-gray-1";

const BTN_BASE =
  "inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-[11px] text-[15px] font-medium transition-colors duration-[180ms]";
const BTN_OUTLINE = `${BTN_BASE} border border-line text-ink hover:border-ink hover:bg-bg-soft`;
const BTN_PRIMARY = `${BTN_BASE} bg-ink text-white hover:bg-[#222]`;

export function Pricing() {
  return (
    <section className="py-[clamp(52px,6.5vw,92px)]" id="pricing">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-[clamp(24px,5vw,40px)]">
        <Reveal className="mb-[clamp(30px,3.8vw,48px)] max-w-[660px]">
          <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Pricing</span>
          <h2 className="mt-4 text-[clamp(30px,4vw,46px)] font-semibold leading-[1.08] tracking-[-0.025em]">Start free. Scale when it matters.</h2>
          <p className="mt-[18px] max-w-[56ch] text-[clamp(16px,1.3vw,18px)] leading-[1.6] text-gray-1">
            One audit or ten thousand — the checks are identical. You pay for
            history, automation and seats, never for a better score.
          </p>
        </Reveal>
        <Reveal className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[640px] border-collapse text-[15px]">
            <thead>
              <tr>
                <th className={TH_FEAT}>
                  <span className={PLAN_CLASS}>Plans</span>
                </th>
                <th className={TH_COL}>
                  <span className={PLAN_CLASS}>Free</span>
                  <span className={PRICE_CLASS}>$0 / forever</span>
                </th>
                <th className={TH_COL}>
                  <span className="mb-2.5 inline-block rounded-full bg-ink px-[9px] py-[3px] font-mono text-[9.5px] uppercase tracking-[0.06em] text-white">Popular</span>
                  <br />
                  <span className={PLAN_CLASS}>Pro</span>
                  <span className={PRICE_CLASS}>$29 / month</span>
                </th>
                <th className={TH_COL}>
                  <span className={PLAN_CLASS}>Team</span>
                  <span className={PRICE_CLASS}>$99 / month</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={TD_FEAT}>Audits per month</td>
                <td className={TD_VAL}>25</td>
                <td className={TD_VAL}>2,000</td>
                <td className={TD_VAL}>Unlimited</td>
              </tr>
              <tr>
                <td className={TD_FEAT}>URLs tracked</td>
                <td className={TD_VAL}>1</td>
                <td className={TD_VAL}>25</td>
                <td className={TD_VAL}>Unlimited</td>
              </tr>
              <tr>
                <td className={TD_FEAT}>Scheduled re-audits</td>
                <td className={TD_VAL_DASH}>—</td>
                <td className={TD_VAL}>Daily</td>
                <td className={TD_VAL}>Hourly</td>
              </tr>
              <tr>
                <td className={TD_FEAT}>Run history</td>
                <td className={TD_VAL}>7 days</td>
                <td className={TD_VAL}>1 year</td>
                <td className={TD_VAL}>Unlimited</td>
              </tr>
              <tr>
                <td className={TD_FEAT}>Team seats</td>
                <td className={TD_VAL}>1</td>
                <td className={TD_VAL}>3</td>
                <td className={TD_VAL}>Unlimited</td>
              </tr>
              <tr>
                <td className={TD_FEAT}>Slack &amp; webhook alerts</td>
                <td className={TD_CELL}>
                  <span className="text-faint">—</span>
                </td>
                <td className={TD_CELL}>
                  <span className="text-ink">✓</span>
                </td>
                <td className={TD_CELL}>
                  <span className="text-ink">✓</span>
                </td>
              </tr>
              <tr>
                <td className={TD_FEAT}>CI &amp; REST API access</td>
                <td className={TD_CELL}>
                  <span className="text-faint">—</span>
                </td>
                <td className={TD_CELL}>
                  <span className="text-ink">✓</span>
                </td>
                <td className={TD_CELL}>
                  <span className="text-ink">✓</span>
                </td>
              </tr>
              <tr className="[&>td]:border-b-0 [&>td]:pt-6">
                <td className={TD_BASE}></td>
                <td className={TD_CELL}>
                  <a className={BTN_OUTLINE} href="#start">
                    Get started
                  </a>
                </td>
                <td className={TD_CELL}>
                  <a className={BTN_PRIMARY} href="#start">
                    Upgrade to Pro
                  </a>
                </td>
                <td className={TD_CELL}>
                  <a className={BTN_OUTLINE} href="#start">
                    Contact sales
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}
