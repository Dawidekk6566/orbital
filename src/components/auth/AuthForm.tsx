"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  signInWithPassword,
  signUpWithPassword,
  type AuthState,
} from "@/lib/auth/actions";

/* ============================================================
   AuthForm — shared login/signup client form. Email+password go
   through Server Actions (useActionState); Google/GitHub OAuth is
   initiated here and returns via /auth/callback. Monochrome,
   hairline, matches the marketing button system.
   ============================================================ */

type Mode = "login" | "signup";

const BTN =
  "inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-[11px] text-[15px] font-medium transition-colors duration-[180ms] disabled:opacity-60";
const BTN_PRIMARY = `${BTN} bg-ink text-white hover:bg-[#222]`;
const INPUT =
  "w-full rounded-[8px] border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors focus:border-ink";
const LABEL = "mb-1.5 block text-[13px] font-medium text-ink-2";

/* ------------------------------------------------------------
   Branded OAuth buttons follow the providers' official rules.
   Google — "Sign in with Google" branding guidelines (dark theme):
     fill #131314, 1px inside stroke #8E918F, text #E3E3E3, the
     standard full-colour "G", approved label ("Continue with Google"
     is allowed), 14/20 medium text. Logo colour/ratio unchanged.
     https://developers.google.com/identity/branding-guidelines
   GitHub — brand toolkit: the Invertocat may appear only in white,
     black (or grey/green); never recoloured or reshaped. On the dark
     fill we use the official white mark.
     https://brand.github.com
   ------------------------------------------------------------ */
const OAUTH_BTN =
  "inline-flex h-11 w-full items-center justify-center gap-2.5 whitespace-nowrap rounded-full px-4 text-[14px] font-medium leading-5 transition-colors duration-[180ms] disabled:opacity-60";
const GOOGLE_BTN = `${OAUTH_BTN} border border-[#8E918F] bg-[#131314] text-[#E3E3E3] hover:bg-[#1e1f22]`;
const GITHUB_BTN = `${OAUTH_BTN} border border-[#3d444d] bg-[#1f2328] text-[#ffffff] hover:bg-[#2b3139]`;

/* Standard full-colour Google "G" — exact brand asset, do not recolour. */
function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

/* Official GitHub Invertocat, rendered white (currentColor) on the dark fill. */
function GitHubMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="shrink-0">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function AuthForm({
  mode,
  next,
  notice,
}: {
  mode: Mode;
  next?: string;
  notice?: string;
}) {
  const action = mode === "login" ? signInWithPassword : signUpWithPassword;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    undefined,
  );
  const [oauthPending, setOauthPending] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  async function signInWithOAuth(provider: "google" | "github") {
    setOauthError(null);
    setOauthPending(provider);
    try {
      const supabase = createClient();
      const params = new URLSearchParams();
      if (next) params.set("next", next);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback${
            params.toString() ? `?${params}` : ""
          }`,
        },
      });
      if (error) {
        setOauthError(error.message);
        setOauthPending(null);
      }
    } catch {
      setOauthError("Authentication is not configured on this deployment.");
      setOauthPending(null);
    }
  }

  return (
    <div>
      {notice ? (
        <div className="mb-5 rounded-[8px] border border-line bg-bg-soft px-4 py-3 text-[13px] text-gray-1">
          {notice}
        </div>
      ) : null}
      <h1 className="text-[26px] font-semibold tracking-[-0.02em]">
        {mode === "login" ? "Sign in to Orbital" : "Create your account"}
      </h1>
      <p className="mt-2 text-[14px] text-gray-1">
        {mode === "login"
          ? "Welcome back. Pick up where you left off."
          : "Start auditing sites in seconds — no card required."}
      </p>

      <div className="mt-7 flex flex-col gap-2.5">
        <button
          type="button"
          className={GOOGLE_BTN}
          onClick={() => signInWithOAuth("google")}
          disabled={oauthPending !== null}
        >
          <GoogleG />
          {oauthPending === "google" ? "Redirecting…" : "Continue with Google"}
        </button>
        <button
          type="button"
          className={GITHUB_BTN}
          onClick={() => signInWithOAuth("github")}
          disabled={oauthPending !== null}
        >
          <GitHubMark />
          {oauthPending === "github" ? "Redirecting…" : "Continue with GitHub"}
        </button>
      </div>

      {oauthError ? (
        <p className="mt-3 text-[13px] text-bad">{oauthError}</p>
      ) : null}

      <div className="my-6 flex items-center gap-3 text-[12px] uppercase tracking-[0.08em] text-faint">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        {next ? <input type="hidden" name="next" value={next} /> : null}

        {mode === "signup" ? (
          <div>
            <label className={LABEL} htmlFor="fullName">
              Name <span className="text-faint">(optional)</span>
            </label>
            <input id="fullName" name="fullName" className={INPUT} autoComplete="name" />
          </div>
        ) : null}

        <div>
          <label className={LABEL} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={INPUT}
          />
          {state?.fieldErrors?.email ? (
            <p className="mt-1 text-[12.5px] text-bad">{state.fieldErrors.email[0]}</p>
          ) : null}
        </div>

        <div>
          <label className={LABEL} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className={INPUT}
          />
          {state?.fieldErrors?.password ? (
            <p className="mt-1 text-[12.5px] text-bad">{state.fieldErrors.password[0]}</p>
          ) : null}
        </div>

        {state?.error ? (
          <p className="text-[13px] text-bad">{state.error}</p>
        ) : null}
        {state?.notice ? (
          <p className="text-[13px] text-good">{state.notice}</p>
        ) : null}

        <button type="submit" className={BTN_PRIMARY} disabled={pending}>
          {pending
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-[14px] text-gray-1">
        {mode === "login" ? (
          <>
            New to Orbital?{" "}
            <Link href="/signup" className="text-ink underline underline-offset-2">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-ink underline underline-offset-2">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
