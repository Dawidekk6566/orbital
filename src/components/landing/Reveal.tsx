"use client";

import { createElement } from "react";
import type { ElementType, ReactNode } from "react";
import { useReveal } from "./useReveal";

/* ============================================================
   Uniwersalny wrapper .reveal → .in (fade-up przy wejściu w widok).
   ============================================================ */

type RevealProps = {
  as?: ElementType;
  className?: string;
  children: ReactNode;
} & Record<string, unknown>;

export function Reveal({
  as: Tag = "div",
  className = "",
  children,
  ...rest
}: RevealProps) {
  const { ref, inView } = useReveal<HTMLElement>();
  return createElement(
    Tag,
    {
      ref,
      className: `transition-[opacity,transform] duration-[600ms] ease-[ease] ${
        inView ? "translate-y-0 opacity-100" : "translate-y-[8px] opacity-0"
      }${className ? ` ${className}` : ""}`,
      ...rest,
    },
    children,
  );
}
