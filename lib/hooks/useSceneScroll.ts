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
 * Exponential-decay smoothing factor (per 16.667 ms frame at 60 fps).
 *
 * Candidate analysis (time to settle 99% of a step at 60 fps):
 *   0.08 → ~(0.92^N < 0.01) → N ≈ 57 frames ≈ 950 ms  — too laggy during fast scroll
 *   0.10 → N ≈ 44 frames ≈ 733 ms                       — still sluggish on fast sweep
 *   0.12 → N ≈ 36 frames ≈ 600 ms  ← chosen             — smooth, responsive, no lag feel
 *   0.14 → N ≈ 31 frames ≈ 517 ms                       — acceptable but slightly snappier
 *   0.16 → N ≈ 27 frames ≈ 450 ms                       — noticeably closer to unsmoothed
 *
 * 0.12 produces ~200 ms 90%-settlement time — enough to absorb a Windows mouse-wheel
 * burst (100 px / 9.3% jump) without visible lag on slow trackpad gestures.
 * The lerp is frame-rate-independent via the dt-scaled exponent below.
 */
const SMOOTH_FACTOR = 0.12;

/**
 * Progress delta at which the lerp loop considers itself converged and stops.
 * 0.0005 = 0.05% of the [0,1] range. In the largest animation (rightSlide 24px
 * over a 0.25-wide sub-range), this represents a 0.048 px visual residual —
 * imperceptible at any display density.
 */
const SNAP_THRESHOLD = 0.0005;

/**
 * Tracks normalized scroll progress (0.0 to 1.0) through a tall sticky container.
 * Progress begins (0.0) when the container's top hits the viewport top,
 * and reaches 1.0 when the bottom of the container catches up to the viewport bottom.
 *
 * Output progress is smoothed through a frame-rate-independent exponential-decay
 * lerp to prevent CSS transitions from being interrupted by large scroll deltas
 * (e.g. Windows mouse-wheel notches, trackpad fast-swipe). The RAF loop is only
 * active while progress is converging — it is fully idle at rest.
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

  // Lerp state kept in refs to avoid stale closures inside the RAF tick.
  // These are never read by render — only by the RAF loop.
  const rawProgressRef = useRef(0.0);    // latest value read from the DOM
  const smoothProgressRef = useRef(0.0); // current interpolated value
  const rafIdRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null); // timestamp from previous RAF tick

  useEffect(() => {
    if (!isDesktop || reducedMotion) {
      return;
    }

    // --- Raw position reader -------------------------------------------------
    const readRaw = (): number => {
      const el = containerRef.current;
      if (!el) return rawProgressRef.current;

      const rect = el.getBoundingClientRect();
      const windowH = window.innerHeight;
      const totalDistance = rect.height - windowH;

      if (totalDistance <= 0) return 1.0;

      const scrolled = -rect.top;
      return Math.min(1.0, Math.max(0.0, scrolled / totalDistance));
    };

    // --- Frame-rate-independent lerp loop ------------------------------------
    //
    // The loop is started whenever raw progress changes (on scroll / resize).
    // It is self-terminating: once |smooth - raw| < SNAP_THRESHOLD it snaps
    // to the exact raw value and cancels itself. At rest there is no RAF.
    //
    // dt-scaled factor: factor = 1 - (1 - SMOOTH_FACTOR)^(dt / 16.667)
    //   At 60 Hz (dt ≈ 16.67 ms): factor ≈ SMOOTH_FACTOR (0.12)
    //   At 120 Hz (dt ≈  8.33 ms): factor ≈ 0.063  — same time-domain behaviour
    //   At  30 Hz (dt ≈ 33.33 ms): factor ≈ 0.225  — slightly faster catch-up, still smooth
    //
    const startLoop = () => {
      // Idempotent — do nothing if already running
      if (rafIdRef.current !== null) return;

      lastTsRef.current = null;

      const tick = (timestamp: number) => {
        // Compute dt; cap at 100 ms to handle tab-hidden resume gracefully
        const dt = lastTsRef.current !== null
          ? Math.min(timestamp - lastTsRef.current, 100)
          : 16.667;
        lastTsRef.current = timestamp;

        // Frame-rate-independent factor
        const factor = 1 - Math.pow(1 - SMOOTH_FACTOR, dt / 16.667);

        const raw = rawProgressRef.current;
        const prev = smoothProgressRef.current;
        const diff = raw - prev;

        if (Math.abs(diff) <= SNAP_THRESHOLD) {
          // Converged — snap exact, stop loop, clear timestamp
          smoothProgressRef.current = raw;
          setProgress(raw);
          rafIdRef.current = null;
          lastTsRef.current = null;
        } else {
          const next = prev + diff * factor;
          smoothProgressRef.current = next;
          setProgress(next);
          rafIdRef.current = requestAnimationFrame(tick);
        }
      };

      rafIdRef.current = requestAnimationFrame(tick);
    };

    // --- Scroll / resize handler ---------------------------------------------
    //
    // Unlike the original (which used its own RAF gate to debounce), we now
    // write to rawProgressRef synchronously on scroll and rely on the lerp
    // loop's RAF to do the reading. This is safe: rawProgressRef is a ref
    // (not state), so writing it from the scroll handler has no rendering cost.
    //
    const onScroll = () => {
      rawProgressRef.current = readRaw();
      startLoop();
    };

    // --- Initialise ----------------------------------------------------------
    // Read initial position synchronously (effect runs after first paint, so
    // layout is stable). Set both raw and smooth to the same value so the loop
    // starts from the correct position without a lerp artifact on first load.
    const initial = readRaw();
    rawProgressRef.current = initial;
    smoothProgressRef.current = initial;
    setProgress(initial);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      // Cancel any in-flight RAF and remove listeners
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
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
