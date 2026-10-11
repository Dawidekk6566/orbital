import { requireUser, getCurrentTeam } from "@/lib/auth/dal";
import { DashboardShell } from "@/components/dashboard/app/DashboardShell";
import { CalmBackground } from "@/components/visual/CalmBackground";
import {
  listNotifications,
  unreadNotificationCount,
} from "@/lib/dashboard/queries";

/* ============================================================
   (dashboard) layout — Server Component. requireUser() is the
   real gate (redirects to /login); the proxy only pre-filters
   optimistically. Renders the top-nav shell around the account
   pages. Team/plan drives the plan pill and gating downstream.

   force-dynamic: every dashboard page is per-user and auth-gated
   (reads cookies via the Supabase server client), so none of them
   should be statically prerendered/cached. Applies to all nested
   segments. Route-segment config is inherited from the layout.
   ============================================================ */

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/dashboard");
  const [team, notifications, unreadCount] = await Promise.all([
    getCurrentTeam(),
    listNotifications(),
    unreadNotificationCount(),
  ]);

  return (
    <>
      <CalmBackground />
      <DashboardShell
        userEmail={user.email}
        plan={team?.plan ?? "free"}
        notifications={notifications}
        unreadCount={unreadCount}
      >
        {children}
      </DashboardShell>
    </>
  );
}
