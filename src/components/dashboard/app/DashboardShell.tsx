import Link from "next/link";
import { TopNavTabs } from "./TopNavTabs";
import { NotificationBell } from "./NotificationBell";
import { AppHeaderMeasure } from "./AppHeaderMeasure";
import { signOut } from "@/lib/auth/actions";
import type { PlanId } from "@/lib/plans";
import { PLAN_LABELS } from "@/lib/plans";
import type { NotificationRow } from "@/lib/dashboard/queries";

/* ============================================================
   DashboardShell — top-navigation account chrome. Orbital mark,
   horizontal tabs, a plan pill, the notification bell and a
   sign-out control on a hairline header. No marketing footer/modal.
   Strict monochrome tokens.
   ============================================================ */

export function DashboardShell({
  children,
  userEmail,
  plan = "free",
  notifications = [],
  unreadCount = 0,
}: {
  children: React.ReactNode;
  userEmail: string | null;
  plan?: PlanId;
  notifications?: NotificationRow[];
  unreadCount?: number;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 border-b border-line bg-white/[0.92] backdrop-blur print:hidden">
        <div className="mx-auto w-full max-w-[1200px] px-[clamp(20px,4vw,36px)]">
          <div className="flex h-14 items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.02em]"
                aria-label="Orbital dashboard"
              >
                <span
                  className="relative block h-4 w-4 flex-none rounded-full border-[1.6px] border-ink after:absolute after:left-1/2 after:top-[1.5px] after:-ml-[1.7px] after:h-[3.4px] after:w-[3.4px] after:rounded-full after:bg-ink after:content-['']"
                  aria-hidden="true"
                />
                Orbital
              </Link>
              <span className="rounded-full border border-line px-2.5 py-[3px] font-mono text-[11px] uppercase tracking-[0.05em] text-gray-1">
                {PLAN_LABELS[plan]}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/audits/new"
                className="hidden rounded-full bg-ink px-4 py-1.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 sm:inline-block"
              >
                New audit
              </Link>
              {userEmail ? (
                <Link
                  href="/dashboard/settings"
                  className="hidden text-[13px] text-gray-1 transition-colors hover:text-ink sm:inline"
                >
                  {userEmail}
                </Link>
              ) : null}
              <NotificationBell
                initialItems={notifications}
                initialUnread={unreadCount}
              />
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-[14px] text-gray-1 transition-colors hover:text-ink"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
          <TopNavTabs />
          <AppHeaderMeasure />
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-[clamp(20px,4vw,36px)] py-[clamp(24px,4vw,44px)]">
        {children}
      </main>
    </div>
  );
}
