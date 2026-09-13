"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

function subscribeResize(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

const getDesktopSnapshot = () =>
  typeof window !== "undefined" ? window.innerWidth >= 1024 : true;
const getDesktopServerSnapshot = () => true;

const getReducedMotionSnapshot = () =>
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
const getReducedMotionServerSnapshot = () => false;

/**
 * Tracks normalized scroll progress (0.0 to 1.0) through a tall sticky container.
 * Progress begins (0.0) when the container's top hits the viewport top,
 * and reaches 1.0 when the bottom of the container catches up to the viewport bottom.
 */
export function useSceneScroll(): [
  React.RefObject<HTMLDivElement | null>,
  number,
  boolean,
  boolean
] {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Synchronized external stores: deterministic SSR + client hydration snapshots
  const isDesktop = useSyncExternalStore(
    subscribeResize,
    getDesktopSnapshot,
    getDesktopServerSnapshot
  );

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  // Scroll progress starts deterministically at 0.0
  const [progress, setProgress] = useState<number>(0.0);

  useEffect(() => {
    if (!isDesktop || reducedMotion) {
      return;
    }

    const update = () => {
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const windowH = window.innerHeight;
      const totalDistance = rect.height - windowH;

      if (totalDistance <= 0) {
        setProgress(1.0);
        return;
      }

      const scrolled = -rect.top;
      const raw = scrolled / totalDistance;
      const clamped = Math.min(1.0, Math.max(0.0, raw));
      setProgress(clamped);
    };

    let rafId: number | null = null;
    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        update();
        rafId = null;
      });
    };

    // Calculate initial position asynchronously outside effect body
    rafId = requestAnimationFrame(() => {
      update();
      rafId = null;
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isDesktop, reducedMotion]);

  const effectiveProgress = !isDesktop || reducedMotion ? 1.0 : progress;

  return [containerRef, effectiveProgress, reducedMotion, isDesktop];
}

/**
 * Maps global progress (0..1) to a local sub-range [start..end] with smooth clamping (0..1).
 */
export function subProgress(progress: number, start: number, end: number): number {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  return (progress - start) / (end - start);
}
