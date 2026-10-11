"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/* ============================================================
   Auth Server Actions — email/password sign-in and sign-up.
   OAuth (Google/GitHub) is initiated client-side via
   supabase.auth.signInWithOAuth and returns through /auth/callback.
   ============================================================ */

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  notice?: string;
} | undefined;

const CredentialsSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const SignUpSchema = CredentialsSchema.extend({
  fullName: z.string().trim().max(120).optional(),
});

function safeNext(raw: FormDataEntryValue | null): string {
  const v = typeof raw === "string" ? raw : "";
  // Only allow same-origin absolute paths to prevent open redirects.
  return v.startsWith("/") && !v.startsWith("//") ? v : "/dashboard";
}

export async function signInWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: "Authentication is not configured on this deployment." };
  }

  const parsed = CredentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "Incorrect email or password." };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signUpWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: "Authentication is not configured on this deployment." };
  }

  const parsed = SignUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: parsed.data.fullName ? { full_name: parsed.data.fullName } : undefined,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If email confirmation is required, no session is returned yet.
  if (!data.session) {
    return {
      notice: "Check your inbox to confirm your email, then sign in.",
    };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
