"use client";

import dynamic from "next/dynamic";
import type { ColorBendsProps } from "./ColorBends";

/**
 * Lazily loads ColorBends (and its `three` dependency) as a separate client chunk instead of
 * bundling it into the main page JS. This is purely a decorative landing-page background effect,
 * so it should never block or add weight to the initial page load / hydration.
 */
const ColorBends = dynamic<ColorBendsProps>(() => import("./ColorBends"), {
  ssr: false,
});

export default ColorBends;
