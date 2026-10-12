export function LogoCloud() {
  return (
    <section className="border-y border-line">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-[clamp(24px,5vw,40px)] py-[clamp(40px,5vw,56px)]">
        <p className="mb-[34px] text-center text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Trusted by engineering teams at</p>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-[clamp(30px,5.5vw,68px)]">
          <span className="flex items-center gap-2 text-[18px] font-semibold tracking-[-0.02em] text-faint transition-colors duration-200 hover:text-gray-1">
            <svg className="h-[18px] w-[18px] flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M4 20V4l16 16V4" />
            </svg>
            Northwind
          </span>
          <span className="flex items-center gap-2 text-[18px] font-semibold tracking-[-0.02em] text-faint transition-colors duration-200 hover:text-gray-1">
            <svg className="h-[18px] w-[18px] flex-none" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Vercept
          </span>
          <span className="flex items-center gap-2 text-[18px] font-semibold tracking-[-0.02em] text-faint transition-colors duration-200 hover:text-gray-1">
            <svg className="h-[18px] w-[18px] flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M4 12h16M12 4v16" />
            </svg>
            Lattice
          </span>
          <span className="flex items-center gap-2 text-[18px] font-semibold tracking-[-0.02em] text-faint transition-colors duration-200 hover:text-gray-1">
            <svg className="h-[18px] w-[18px] flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M12 3l9 16H3z" />
            </svg>
            Halcyon
          </span>
          <span className="flex items-center gap-2 text-[18px] font-semibold tracking-[-0.02em] text-faint transition-colors duration-200 hover:text-gray-1">
            <svg className="h-[18px] w-[18px] flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M3 12h6l2-5 3 12 2-7h5" />
            </svg>
            Fathom
          </span>
          <span className="flex items-center gap-2 text-[18px] font-semibold tracking-[-0.02em] text-faint transition-colors duration-200 hover:text-gray-1">
            <svg className="h-[18px] w-[18px] flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="8" cy="8" r="4" />
              <circle cx="16" cy="16" r="4" />
            </svg>
            Monogram
          </span>
        </div>
      </div>
    </section>
  );
}
