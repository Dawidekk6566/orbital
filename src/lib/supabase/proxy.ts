import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

/* ============================================================
   Proxy Supabase client — refreshes the auth session cookie on
   navigations and performs an OPTIMISTIC redirect only. Per the
   Next.js 16 proxy docs this is NOT a security boundary (a matcher
   that excludes a path also skips Server Function calls there), so
   the real gate is the DAL + Postgres RLS. Never run DB reads here.

   Returns the (possibly cookie-updated) NextResponse to send back.
   ============================================================ */

const PUBLIC_PATHS = ["/", "/pricing", "/login", "/signup", "/auth"];
const AUTH_PATHS = ["/login", "/signup"];

function isProtected(pathname: string): boolean {
  return pathname.startsWith("/dashboard");
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  // Without Supabase env the app runs as the public marketing site;
  // never redirect (the dashboard simply isn't reachable/usable).
  if (!isSupabaseConfigured()) {
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // IMPORTANT: getUser() (not getSession()) so the token is verified.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Unauthenticated hitting a protected route → /login?next=…
  if (!user && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated hitting an auth page → /dashboard
  if (user && isAuthPage(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export { PUBLIC_PATHS };
