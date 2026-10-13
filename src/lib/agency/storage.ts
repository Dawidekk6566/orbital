"use client";

import { useSyncExternalStore, useCallback } from "react";
import { AgencySettings, DEFAULT_AGENCY_SETTINGS } from "./types";

const STORAGE_KEY = "orbital_agency_settings_v1";

let cachedRaw: string | null = null;
let cachedParsed: AgencySettings = DEFAULT_AGENCY_SETTINGS;

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("orbital:agency_updated", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("orbital:agency_updated", callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): AgencySettings {
  if (typeof window === "undefined") return DEFAULT_AGENCY_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedParsed;
    cachedRaw = raw;
    if (!raw) {
      cachedParsed = DEFAULT_AGENCY_SETTINGS;
    } else {
      cachedParsed = { ...DEFAULT_AGENCY_SETTINGS, ...JSON.parse(raw) };
    }
    return cachedParsed;
  } catch {
    return DEFAULT_AGENCY_SETTINGS;
  }
}

function getServerSnapshot(): AgencySettings {
  return DEFAULT_AGENCY_SETTINGS;
}

export function saveStoredAgencySettings(settings: AgencySettings): void {
  if (typeof window === "undefined") return;
  try {
    const json = JSON.stringify(settings);
    localStorage.setItem(STORAGE_KEY, json);
    cachedRaw = json;
    cachedParsed = settings;
    window.dispatchEvent(new CustomEvent("orbital:agency_updated", { detail: settings }));
  } catch {
    // Storage quota or privacy restriction
  }
}

export function useAgencySettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = useCallback((newSettings: Partial<AgencySettings>) => {
    const next = { ...settings, ...newSettings };
    saveStoredAgencySettings(next);
  }, [settings]);

  const reset = useCallback(() => {
    saveStoredAgencySettings(DEFAULT_AGENCY_SETTINGS);
  }, []);

  return { settings, update, reset, mounted: true };
}
