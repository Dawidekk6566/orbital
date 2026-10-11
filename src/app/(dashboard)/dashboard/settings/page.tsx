import type { Metadata } from "next";
import { getUser, getProfile } from "@/lib/auth/dal";
import { ProfileForm } from "@/components/dashboard/ProfileForm";

export const metadata: Metadata = {
  title: "Settings — Orbital",
};

/* ============================================================
   Settings (/dashboard/settings) — the account area. Edit your
   display name and avatar; email is read-only (owned by the auth
   identity). Team-level settings live on /dashboard/team.
   ============================================================ */

export default async function SettingsPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);

  const email = profile?.email ?? user?.email ?? null;

  return (
    <div>
      <header>
        <h1 className="text-[clamp(22px,3vw,30px)] font-semibold tracking-[-0.025em]">
          Settings
        </h1>
        <p className="mt-1 text-[13px] text-gray-1">
          Manage your personal account details.
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-[12px] uppercase tracking-[0.06em] text-muted">
          Profile
        </h2>
        <div className="mt-3">
          <ProfileForm
            email={email}
            fullName={profile?.full_name ?? null}
            avatarUrl={profile?.avatar_url ?? null}
          />
        </div>
      </section>
    </div>
  );
}
