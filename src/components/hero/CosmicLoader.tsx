"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/i18n/provider";

/* ============================================================
   Loader — minimalny obracający się pierścień (Swiss mono)
   i rotujące komunikaty statusu z t.loader.messages.
   ============================================================ */

export function CosmicLoader() {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const messages = t.loader.messages;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 1800);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <div
      className="flex flex-col items-center justify-center gap-8 py-16"
      role="status"
      aria-live="polite"
    >
      <div className="relative h-16 w-16">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-line"
          style={{ borderTopColor: "var(--color-ink)" }}
          animate={reduced ? {} : { rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="h-6 overflow-hidden text-center">
        <motion.p
          key={index}
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4 }}
          className="font-mono text-sm font-medium text-gray-1"
        >
          {messages[index]}
        </motion.p>
      </div>

      {/* Pasek postępu (nieokreślony) */}
      <div className="h-1 w-56 overflow-hidden rounded-full bg-line-2">
        <motion.div
          className="h-full w-1/3 rounded-full bg-ink"
          animate={reduced ? { x: 0 } : { x: ["-100%", "300%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
