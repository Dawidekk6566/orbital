"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/app/(dashboard)/actions/notifications";
import { timeAgo } from "@/lib/dashboard/score";
import type { NotificationRow } from "@/lib/dashboard/queries";

/* ============================================================
   NotificationBell — the account inbox. Seeds from server-rendered
   rows, then subscribes to Supabase Realtime for new inserts so the
   badge updates live without a reload. Reads only; the session here
   is never trusted for authorization (RLS + the DAL are the gate).
   Degrades to a static bell when Supabase/Realtime isn't configured.
   ============================================================ */

const SEV_DOT: Record<NotificationRow["severity"], string> = {
  info: "bg-line",
  warn: "bg-warn",
  critical: "bg-bad",
};

export function NotificationBell({
  initialItems,
  initialUnread,
}: {
  initialItems: NotificationRow[];
  initialUnread: number;
}) {
  const [items, setItems] = useState<NotificationRow[]>(initialItems);
  const [unread, setUnread] = useState(initialUnread);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Live inserts via Realtime (best-effort; silent when unavailable).
  useEffect(() => {
    let supabase;
    try {
      supabase = createClient();
    } catch {
      return;
    }
    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new as NotificationRow;
          setItems((prev) => [row, ...prev].slice(0, 20));
          if (!row.read_at) setUnread((n) => n + 1);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function readOne(row: NotificationRow) {
    if (row.read_at) return;
    setItems((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, read_at: new Date().toISOString() } : r)),
    );
    setUnread((n) => Math.max(0, n - 1));
    void markNotificationRead(row.id);
  }

  function readAll() {
    if (unread === 0) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((r) => (r.read_at ? r : { ...r, read_at: now })));
    setUnread(0);
    void markAllNotificationsRead();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        aria-expanded={open}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-gray-1 transition-colors hover:bg-bg-soft hover:text-ink"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 font-mono text-[10px] font-medium text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-10 z-50 w-[340px] overflow-hidden rounded-[10px] border border-line bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-[13px] font-semibold tracking-[-0.01em]">
              Notifications
            </span>
            {unread > 0 ? (
              <button
                type="button"
                onClick={readAll}
                className="text-[12px] text-gray-1 transition-colors hover:text-ink"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-gray-1">
              You&apos;re all caught up.
            </p>
          ) : (
            <ul className="max-h-[380px] divide-y divide-line overflow-y-auto">
              {items.map((n) => {
                const body = (
                  <div className="flex gap-3">
                    <span
                      className={`mt-1.5 h-2 w-2 flex-none rounded-full ${SEV_DOT[n.severity]} ${n.read_at ? "opacity-30" : ""}`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p
                        className={`text-[13px] leading-snug ${n.read_at ? "text-gray-1" : "text-ink"}`}
                      >
                        {n.title}
                      </p>
                      <span className="mt-0.5 block text-[11px] text-muted">
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.audit_id ? (
                      <Link
                        href={`/dashboard/audits/${n.audit_id}`}
                        onClick={() => {
                          readOne(n);
                          setOpen(false);
                        }}
                        className="block px-4 py-3 transition-colors hover:bg-bg-soft"
                      >
                        {body}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => readOne(n)}
                        className="block w-full px-4 py-3 text-left transition-colors hover:bg-bg-soft"
                      >
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
