import { Navbar } from "@/components/layout/Navbar";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { AnalysisOutlet } from "@/components/dashboard/AnalysisOutlet";
import { SpaceBackground } from "@/components/visual/SpaceBackground";
import { getUser } from "@/lib/auth/dal";

/* ============================================================
   (marketing) layout — the public landing chrome: sticky Navbar,
   the <main id="top"> scroll anchor, the ConditionalFooter and the
   guest analysis modal (AnalysisOutlet). Logged-out visitors keep
   the demo modal here; logged-in users land on /dashboard instead.
   getUser() only flips the Navbar CTAs (Sign in/Get started ↔ Go to
   dashboard); the real gate stays in the (dashboard) layout + RLS.
   ============================================================ */

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <>
      <SpaceBackground />
      <Navbar isAuthed={Boolean(user)} />
      <main className="flex-1 w-full max-w-full overflow-x-clip" id="top">
        {children}
      </main>
      <ConditionalFooter />
      <AnalysisOutlet />
    </>
  );
}
