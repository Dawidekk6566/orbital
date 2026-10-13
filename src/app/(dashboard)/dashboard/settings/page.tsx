import type { Metadata } from "next";
import { getUser, getProfile } from "@/lib/auth/dal";
import { ProfileForm } from "@/components/dashboard/ProfileForm";

export const metadata: Metadata = {
  title: "Settings — Orbital",
};

/* ============================================================
   Settings (/dashboard/settings) — Personal account management.
   Manage user display name, avatar, authentication identity
   and interface preferences.
   ============================================================ */

export default async function SettingsPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  const email = profile?.email ?? user?.email ?? null;

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Header with Telemetry Status */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
            <span className="font-mono text-[12px] uppercase tracking-wider text-muted">
              Identity &amp; Preferences / Account Settings
            </span>
          </div>
          <h1 className="mt-1 text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.025em] text-ink">
            Account Settings
          </h1>
          <p className="mt-1 text-[14.5px] text-gray-1">
            Personal profile details, identity email verification, and workspace configuration.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-line bg-bg-soft px-3 py-1 font-mono text-[11.5px] text-gray-1">
          <span className="h-1.5 w-1.5 rounded-full bg-good" />
          <span>Session: Active &amp; Verified</span>
          <span className="text-line-strong">·</span>
          <span className="text-muted">Supabase Auth</span>
        </div>
      </div>

      {/* 2. High-Density Telemetry Metric Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Auth Identity</span>
            <span className="rounded border border-line px-1.5 py-0.5 text-[10px] text-gray-1">
              Verified
            </span>
          </div>
          <p className="mt-2.5 truncate font-mono text-[16px] sm:text-[18px] font-semibold text-ink">
            {email || "Signed in"}
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>Primary email login</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Security Layer</span>
            <span className="font-mono text-[10.5px] text-gray-1">PKCE</span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            Encrypted
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>JWT + HTTP-only cookies</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Theme Mode</span>
            <span className="font-mono text-[10.5px] text-gray-1">System</span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            Adaptive
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>Light / Dark auto-switch</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white/95 p-4.5 dark:bg-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.06em] text-muted">
            <span>Data Rights</span>
            <span className="font-mono text-[10.5px] text-gray-1">GDPR</span>
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-semibold text-ink">
            Exportable
          </p>
          <div className="mt-2 text-[12px] text-muted font-mono">
            <span>Full audit history export</span>
          </div>
        </div>
      </div>

      {/* 3. Settings Forms Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Profile Card */}
        <section className="rounded-[10px] border border-line bg-white/95 p-6 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5">
          <div className="border-b border-line pb-3">
            <h2 className="text-[16px] font-semibold text-ink">
              Profile Information
            </h2>
            <p className="text-[13px] text-muted">
              Update your display name and public avatar.
            </p>
          </div>
          <div className="mt-5">
            <ProfileForm
              email={email}
              fullName={profile?.full_name ?? null}
              avatarUrl={profile?.avatar_url ?? null}
            />
          </div>
        </section>

        {/* Security / Info Sidebar */}
        <aside className="flex flex-col gap-5">
          <div className="rounded-[10px] border border-line bg-white/95 p-5 shadow-[0_2px_12px_rgba(10,10,10,0.02)] dark:bg-white/5 font-mono text-[12px]">
            <span className="text-muted uppercase text-[10.5px]">Account Details</span>
            <div className="mt-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="text-muted">User ID:</span>
                <span className="text-ink truncate max-w-[160px]">{user?.id ? `${user.id.slice(0, 12)}...` : "—"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="text-muted">Identity:</span>
                <span className="text-ink">{email ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Status:</span>
                <span className="text-good font-semibold">● Active</span>
              </div>
            </div>
          </div>

          <div className="rounded-[10px] border border-line bg-bg-soft/40 p-4 font-mono text-[12px]">
            <span className="text-muted uppercase text-[10.5px]">Team Settings:</span>
            <p className="mt-1 text-gray-1 leading-[1.5]">
              To rename your organization workspace, manage team seats, or transfer ownership, visit the Team tab.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
