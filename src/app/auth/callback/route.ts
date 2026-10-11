import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/* ============================================================
   /auth/callback — OAuth + email-confirmation return handler.
   Placed OUTSIDE the route groups so the redirect URI is exactly
   /auth/callback. Exchanges the code for a session (cookies are
   written via the SSR client), then redirects to ?next= or
   /dashboard. Guest-import claim will hook in here later.
   ============================================================ */

function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/dashboard";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  const errorDescription = searchParams.get("error_description");

  if (errorDescription) {
    const url = new URL("/login", origin);
    url.searchParams.set("error", errorDescription);
    return NextResponse.redirect(url);
  }

  if (code && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Activate any team invites addressed to this account's email.
      // Idempotent; safe to call on every sign-in. Best-effort.
      await supabase.rpc("claim_pending_invites").then(
        () => undefined,
        () => undefined,
      );
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  const url = new URL("/login", origin);
  url.searchParams.set("error", "Could not complete sign-in. Please try again.");
  return NextResponse.redirect(url);
}
