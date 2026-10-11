import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  requireSupabaseConfig,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} from "./config";

/* ============================================================
   Server Supabase clients.

   `createClient()` — request-scoped, bound to the Next.js cookie
   store. Use in Server Components, Server Actions and Route
   Handlers. Cookie writes from Server Components are swallowed
   (they run in a read-only context); the proxy refreshes cookies.

   `createServiceRoleClient()` — bypasses RLS. ONLY for trusted
   server-to-server writes (QStash worker, Stripe webhook). Never
   expose to a user-driven request without an explicit authz gate.
   ============================================================ */

export async function createClient() {
  const { url, anonKey } = requireSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component: cookie mutation is not
          // allowed here. The proxy handles session refresh, so this
          // is safe to ignore.
        }
      },
    },
  });
}

export function createServiceRoleClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Service-role Supabase is not configured. Set SUPABASE_SERVICE_ROLE_KEY (server-only) in .env.local.",
    );
  }
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
