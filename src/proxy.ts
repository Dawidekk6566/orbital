import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/* ============================================================
   proxy.ts (Next.js 16 — formerly middleware.ts).
   Runs on the Node runtime before routes render. Refreshes the
   Supabase session cookie and does an OPTIMISTIC auth redirect.
   NOT a security boundary — authorization is enforced in the DAL
   and Postgres RLS. See node_modules/next/.../proxy.md.
   ============================================================ */

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (build assets)
     * - favicon.ico and common static image/font files
     * API routes are matched so /api can refresh cookies too, but
     * worker/webhook handlers verify their own signatures.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
