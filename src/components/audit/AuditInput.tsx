"use client";

import { useState, useTransition } from "react";
import type { AnalyzeRequest } from "@/lib/analysis/types";
import { CosmicLoader } from "@/components/hero/CosmicLoader";

/* ============================================================
   AuditInput — the multi-mode audit entry form (URL · Code · Files ·
   Screenshot). Builds the AnalyzeRequest union client-side and hands
   it to a Server Action prop (validated again on the server). Reused
   by the dashboard "New audit" page; the marketing landing keeps its
   own URL-only AuditForm. English-only (dashboard convention).

   Size guards mirror the server schema AND the 4 MB Server Action
   body cap: base64 inflates ~1.37×, so an image is capped well under
   the raw schema max so the encoded request still fits.
   ============================================================ */

type Mode = "url" | "code" | "files" | "screenshot";
type ActionFn = (
  input: unknown,
) => Promise<{ error?: string; fieldError?: string } | void>;

const TABS: readonly { id: Mode; label: string }[] = [
  { id: "url", label: "URL" },
  { id: "code", label: "Code" },
  { id: "files", label: "Files" },
  { id: "screenshot", label: "Screenshot" },
];

const MAX_FILE_BYTES = 500_000;
const MAX_FILES = 30;
const MAX_TOTAL_BYTES = 3_000_000; // keep the whole SA body under 4 MB
const MAX_IMAGE_BYTES = 2_500_000; // ~3.4 MB once base64-encoded

const FIELD =
  "w-full rounded-[8px] border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors focus:border-ink";
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#222] disabled:opacity-60";
const LABEL = "block text-[13px] font-medium text-ink";
const HINT = "mt-1.5 text-[12px] text-muted";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function fmtKb(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
export function AuditInput({ action }: { action: ActionFn }) {
  const [mode, setMode] = useState<Mode>("url");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [url, setUrl] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<"auto" | "html" | "css" | "js">("auto");
  const [files, setFiles] = useState<File[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  async function buildRequest(): Promise<AnalyzeRequest> {
    if (mode === "url") {
      const trimmed = url.trim();
      const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      return { mode: "url", url: normalized };
    }
    if (mode === "code") {
      return { mode: "code", code, language };
    }
    if (mode === "files") {
      const contents = await Promise.all(
        files.slice(0, MAX_FILES).map(async (f) => ({
          name: f.name.slice(0, 260),
          content: (await f.text()).slice(0, MAX_FILE_BYTES),
        })),
      );
      return { mode: "files", files: contents };
    }
    const dataUrl = image ? await readAsDataUrl(image) : "";
    return { mode: "screenshot", image: dataUrl, notes: notes.trim() || undefined };
  }

  function validate(): string | null {
    if (mode === "url" && !url.trim()) return "Enter a website URL.";
    if (mode === "code" && !code.trim()) return "Paste some HTML, CSS or JS.";
    if (mode === "files") {
      if (files.length === 0) return "Choose at least one file.";
      if (files.length > MAX_FILES) return `Up to ${MAX_FILES} files at once.`;
      if (files.some((f) => f.size > MAX_FILE_BYTES)) return "Each file must be under 500 KB.";
      if (files.reduce((n, f) => n + f.size, 0) > MAX_TOTAL_BYTES)
        return "Those files are too large in total (max ~3 MB).";
    }
    if (mode === "screenshot") {
      if (!image) return "Choose a screenshot to analyze.";
      if (image.size > MAX_IMAGE_BYTES) return "Image must be under 2.5 MB.";
    }
    return null;
  }

  function submit() {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const result = await action(await buildRequest());
        if (result?.error) setError(result.error);
        else if (result?.fieldError) setError(result.fieldError);
      } catch {
        setError("Something went wrong preparing your input. Try again.");
      }
    });
  }
  return (
    <div>
      <div
        role="tablist"
        aria-label="Audit input mode"
        className="flex flex-wrap gap-1.5"
      >
        {TABS.map((t) => {
          const active = t.id === mode;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setMode(t.id);
                setError(null);
              }}
              className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                active
                  ? "bg-ink text-white"
                  : "border border-line text-gray-1 hover:border-ink hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-4">
        {mode === "url" && (
          <div>
            <label htmlFor="ai-url" className={LABEL}>
              Website URL
            </label>
            <input
              id="ai-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com"
              autoComplete="off"
              className={`${FIELD} mt-1.5`}
            />
            <p className={HINT}>Runs a full Lighthouse + AI audit on the live page.</p>
          </div>
        )}
        {mode === "code" && (
          <div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="ai-code" className={LABEL}>
                Paste code
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as typeof language)}
                aria-label="Language"
                className="rounded-full border border-line px-3 py-1 text-[12px] text-ink outline-none focus:border-ink"
              >
                <option value="auto">Auto-detect</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="js">JavaScript</option>
              </select>
            </div>
            <textarea
              id="ai-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={10}
              placeholder="<!doctype html>…"
              className={`${FIELD} mt-1.5 resize-y font-mono text-[13px]`}
            />
            <p className={HINT}>Static analysis of the markup, styles and scripts you paste.</p>
          </div>
        )}
        {mode === "files" && (
          <div>
            <label htmlFor="ai-files" className={LABEL}>
              Upload files
            </label>
            <input
              id="ai-files"
              type="file"
              multiple
              accept=".html,.htm,.css,.js,.jsx,.ts,.tsx,.json,.svg,.txt,text/*"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              className={`${FIELD} mt-1.5 file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1 file:text-[12px] file:text-white`}
            />
            {files.length > 0 && (
              <ul className="mt-2 space-y-1 font-mono text-[12px] text-gray-1">
                {files.slice(0, MAX_FILES).map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex justify-between gap-3">
                    <span className="truncate">{f.name}</span>
                    <span className="flex-none text-muted">{fmtKb(f.size)}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className={HINT}>
              Up to {MAX_FILES} text files, 500 KB each (~3 MB total).
            </p>
          </div>
        )}

        {mode === "screenshot" && (
          <div>
            <label htmlFor="ai-shot" className={LABEL}>
              Upload a screenshot
            </label>
            <input
              id="ai-shot"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className={`${FIELD} mt-1.5 file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1 file:text-[12px] file:text-white`}
            />
            {image && (
              <p className="mt-2 font-mono text-[12px] text-gray-1">
                {image.name} · {fmtKb(image.size)}
              </p>
            )}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional: what should the audit focus on?"
              aria-label="Notes"
              className={`${FIELD} mt-2 resize-y text-[13px]`}
            />
            <p className={HINT}>PNG, JPEG or WebP under 2.5 MB.</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className={BTN_PRIMARY}
          >
            {pending ? "Auditing…" : "Run audit"}
          </button>
          {error ? <p className="text-[13px] text-bad">{error}</p> : null}
        </div>
      </div>

      {pending && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <CosmicLoader
            target={
              mode === "url"
                ? url.trim()
                : mode === "code"
                ? "Pasted Code Analysis"
                : mode === "files"
                ? `${files.length} Files Analysis`
                : "Screenshot Inspection"
            }
          />
        </div>
      )}
    </div>
  );
}
