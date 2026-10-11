"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALES,
  messages,
  type Locale,
  type Messages,
} from "./messages";

/* ============================================================
   Lekki provider i18n oparty na kontekście Reacta.
   - domyślnie wykrywa język przeglądarki,
   - zapamiętuje wybór w localStorage,
   - bez routingu z prefiksem locale (idealne dla single-page landing).
   ============================================================ */

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
}

const I18nContext = createContext<I18nContextValue | null>(null);
const STORAGE_KEY = "orbital-audit-locale";

function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const lang = navigator.language?.slice(0, 2).toLowerCase();
  return (LOCALES as readonly string[]).includes(lang ?? "")
    ? (lang as Locale)
    : DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // Pierwszy render (SSR + klient) jest deterministyczny — brak hydration mismatch.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? (window.localStorage.getItem(STORAGE_KEY) as Locale | null)
        : null;
    const next =
      stored && (LOCALES as readonly string[]).includes(stored)
        ? stored
        : detectBrowserLocale();
    // localStorage / navigator are client-only; reading them after mount
    // (rather than during render) keeps the first paint deterministic and
    // avoids a hydration mismatch. State update here is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(next);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t: messages[locale] as Messages }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
