"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* ============================================================
   TopNavTabs — horizontal dashboard navigation. Active tab gets an
   ink underline + ink text; the rest are gray-1. Matches on the
   segment so /dashboard/projects/[id] keeps "Projects" active.
   ============================================================ */

type Tab = { href: string; label: string; exact?: boolean };

const TABS: readonly Tab[] = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/history", label: "History" },
  { href: "/dashboard/agency", label: "Agency & PDF" },
  { href: "/dashboard/schedule", label: "Schedule" },
  { href: "/dashboard/alerts", label: "Alerts" },
  { href: "/dashboard/team", label: "Team" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/dashboard/api-keys", label: "API" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function TopNavTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="-ml-3 flex gap-1 overflow-x-auto"
      aria-label="Dashboard"
    >
      {TABS.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`relative whitespace-nowrap px-3 py-3 text-[14px] transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:content-[''] ${
              active
                ? "text-ink after:bg-ink"
                : "text-gray-1 hover:text-ink after:bg-transparent"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
