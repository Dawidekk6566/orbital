"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CosmicLoader } from "@/components/hero/CosmicLoader";

/* ============================================================
   CosmicLoaderModal — Universal React Portal wrapper for CosmicLoader.
   Mounts directly to document.body at z-[99999] so it is never trapped
   by ancestor backdrop-blur, transforms, filters or stacking contexts.
   Ensures 100% viewport coverage across all dashboard tabs and pages.
   ============================================================ */

export function CosmicLoaderModal({
  active,
  target,
  onCancel,
}: {
  active: boolean;
  target?: string | null;
  onCancel?: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !active) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Audit in progress"
    >
      <div className="relative z-10 w-full max-w-[760px] animate-in fade-in zoom-in-95 duration-200">
        <CosmicLoader target={target} onCancel={onCancel} />
      </div>
    </div>,
    document.body
  );
}
