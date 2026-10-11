export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[1200px] px-[clamp(24px,5vw,40px)] py-[clamp(56px,7vw,80px)]">
        <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] gap-10 max-[920px]:grid-cols-2 max-[920px]:gap-x-6 max-[920px]:gap-y-8">
          <div className="max-[920px]:col-span-2">
            <a
              className="mb-4 flex items-center gap-2.5 text-[18px] font-semibold tracking-[-0.02em]"
              href="#top"
            >
              <span
                className="relative block h-4 w-4 flex-none rounded-full border-[1.6px] border-ink after:absolute after:left-1/2 after:top-[1.5px] after:-ml-[1.7px] after:h-[3.4px] after:w-[3.4px] after:rounded-full after:bg-ink after:content-['']"
                aria-hidden="true"
              />
              Orbital
            </a>
            <p className="max-w-[26ch] text-[14px] leading-[1.55] text-gray-1">
              Technical audits for teams that ship. Measure, prioritize, fix —
              then prove it moved.
            </p>
          </div>
          <div>
            <h4 className="mb-[15px] text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
              Product
            </h4>
            <a href="#features" className="block py-[5px] text-[14px] text-gray-1 transition-colors duration-150 hover:text-ink">Overview</a>
            <a href="#pricing" className="block py-[5px] text-[14px] text-gray-1 transition-colors duration-150 hover:text-ink">Pricing</a>
            <a href="#report" className="block py-[5px] text-[14px] text-gray-1 transition-colors duration-150 hover:text-ink">Changelog</a>
            <a href="#top" className="block py-[5px] text-[14px] text-gray-1 transition-colors duration-150 hover:text-ink">Status</a>
          </div>
          <div>
            <h4 className="mb-[15px] text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
              Developers
            </h4>
            <a href="#report" className="block py-[5px] text-[14px] text-gray-1 transition-colors duration-150 hover:text-ink">Docs</a>
            <a href="#report" className="block py-[5px] text-[14px] text-gray-1 transition-colors duration-150 hover:text-ink">API reference</a>
            <a href="#report" className="block py-[5px] text-[14px] text-gray-1 transition-colors duration-150 hover:text-ink">CLI</a>
            <a href="#report" className="block py-[5px] text-[14px] text-gray-1 transition-colors duration-150 hover:text-ink">Integrations</a>
          </div>
          <div>
            <h4 className="mb-[15px] text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
              Company
            </h4>
            <a href="#top" className="block py-[5px] text-[14px] text-gray-1 transition-colors duration-150 hover:text-ink">About</a>
            <a href="#top" className="block py-[5px] text-[14px] text-gray-1 transition-colors duration-150 hover:text-ink">Blog</a>
            <a href="#top" className="block py-[5px] text-[14px] text-gray-1 transition-colors duration-150 hover:text-ink">Careers</a>
            <a href="#top" className="block py-[5px] text-[14px] text-gray-1 transition-colors duration-150 hover:text-ink">Contact</a>
          </div>
          <div>
            <h4 className="mb-[15px] text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
              Legal
            </h4>
            <a href="#top" className="block py-[5px] text-[14px] text-gray-1 transition-colors duration-150 hover:text-ink">Privacy</a>
            <a href="#top" className="block py-[5px] text-[14px] text-gray-1 transition-colors duration-150 hover:text-ink">Terms</a>
            <a href="#top" className="block py-[5px] text-[14px] text-gray-1 transition-colors duration-150 hover:text-ink">Security</a>
            <a href="#top" className="block py-[5px] text-[14px] text-gray-1 transition-colors duration-150 hover:text-ink">DPA</a>
          </div>
        </div>
        <div className="mt-[clamp(40px,5vw,64px)] flex flex-wrap items-center justify-between gap-4 border-t border-line pt-[26px] font-mono text-[13px] text-muted">
          <span>© 2026 Orbital Labs, Inc. · SOC 2 Type II</span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 flex-none rounded-full bg-ink" aria-hidden="true" />
            All systems operational
          </span>
        </div>
      </div>
    </footer>
  );
}
