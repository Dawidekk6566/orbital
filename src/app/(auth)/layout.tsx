import Link from "next/link";
import { SpaceBackground } from "@/components/visual/SpaceBackground";

/* ============================================================
   (auth) layout — minimal centered shell for /login and /signup.
   No marketing chrome, no dashboard nav; just the Orbital mark and
   a hairline card. Kosmiczne tło (gwiazdy) jak na landingu.
   ============================================================ */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <SpaceBackground />
      <Link
        href="/"
        className="mb-10 flex items-center gap-2.5 text-[18px] font-semibold tracking-[-0.02em]"
        aria-label="Orbital home"
      >
        <span
          className="relative block h-4 w-4 flex-none rounded-full border-[1.6px] border-ink after:absolute after:left-1/2 after:top-[1.5px] after:-ml-[1.7px] after:h-[3.4px] after:w-[3.4px] after:rounded-full after:bg-ink after:content-['']"
          aria-hidden="true"
        />
        Orbital
      </Link>
      <div className="w-full max-w-[400px]">{children}</div>
    </div>
  );
}
