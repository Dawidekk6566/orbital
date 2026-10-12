"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface VisualDiffSliderProps {
  beforeImage?: string;
  afterImage?: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export function VisualDiffSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  className = "",
}: VisualDiffSliderProps) {
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      if (e.touches[0]) handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  if (!beforeImage || !afterImage) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded-[10px] border border-line bg-bg-soft ${className}`}
      onMouseDown={() => setIsDragging(true)}
      onTouchStart={() => setIsDragging(true)}
      role="slider"
      aria-valuenow={Math.round(sliderPos)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Visual comparison split slider"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") setSliderPos((p) => Math.max(0, p - 5));
        if (e.key === "ArrowRight") setSliderPos((p) => Math.min(100, p + 5));
      }}
    >
      {/* After image (full width base) */}
      <div className="relative w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afterImage}
          alt={afterLabel}
          className="block h-auto w-full object-cover"
          draggable={false}
        />
        <div className="absolute bottom-3 right-3 rounded-full border border-line bg-white/90 px-2.5 py-1 font-mono text-[11px] font-medium text-ink shadow-sm backdrop-blur">
          {afterLabel}
        </div>
      </div>

      {/* Before image (clipped overlay) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPos}%` }}
      >
        <div className="relative h-full w-[100cqi] min-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={beforeImage}
            alt={beforeLabel}
            className="block h-full w-full object-cover"
            style={{ maxWidth: "none" }}
            draggable={false}
          />
        </div>
        <div className="absolute bottom-3 left-3 rounded-full border border-line bg-white/90 px-2.5 py-1 font-mono text-[11px] font-medium text-ink shadow-sm backdrop-blur">
          {beforeLabel}
        </div>
      </div>

      {/* Divider line & handle */}
      <div
        className="absolute inset-y-0 z-10 w-[2px] bg-ink"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 -ml-3.5 -mt-3.5 flex h-7 w-7 cursor-ew-resize items-center justify-center rounded-full border border-line bg-white shadow-md transition-transform hover:scale-110 active:scale-95">
          <svg
            className="h-3.5 w-3.5 text-ink"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="8 7 3 12 8 17" />
            <polyline points="16 7 21 12 16 17" />
          </svg>
        </div>
      </div>
    </div>
  );
}
