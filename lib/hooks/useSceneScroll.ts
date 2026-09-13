"use client";

import { useEffect, useRef, useState, useCallback } from "react";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Tracks normalized scroll progress (0.0 to 1.0) through a tall sticky container.
 * Progress begins (0.0) when the container's top hits the viewport top,
 * and reaches 1.0 when the bottom of the container catches up to the viewport bottom.
 */
export function useSceneScroll(): [
  React.RefObject<HTMLDivElement | null>,
  number,
  boolean
] {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [reducedMotion] = useState<boolean>(() => prefersReducedMotion());
  const [progress, setProgress] = useState<number>(() =>
    prefersReducedMotion() ? 1.0 : 0.0
  );

  const update = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const windowH = window.innerHeight;
    const totalDistance = rect.height - windowH;

    if (totalDistance <= 0) {
      setProgress(1.0);
      return;
    }

    // Distance scrolled past the top of the container
    const scrolled = -rect.top;
    const raw = scrolled / totalDistance;
    const clamped = Math.min(1.0, Math.max(0.0, raw));
    setProgress(clamped);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        update();
        rafRef.current = null;
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [update, reducedMotion]);

  return [containerRef, progress, reducedMotion];
}

/**
 * Maps global progress (0..1) to a local sub-range [start..end] with smooth clamping (0..1).
 */
export function subProgress(progress: number, start: number, end: number): number {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  return (progress - start) / (end - start);
}
