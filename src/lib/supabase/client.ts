"use client";

import { createBrowserClient } from "@supabase/ssr";

/* ============================================================
   Browser Supabase client (client components only).
   Reads the public env vars inlined at build time. Used for
   sign-in flows (signInWithOAuth, signInWithPassword) and
   Realtime subscriptions (notification bell). Never trust its
   session for authorization — that lives in the DAL + RLS.
   ============================================================ */

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  return createBrowserClient(url, anonKey);
}
