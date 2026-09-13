import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { UnderstandScene } from "@/components/landing/UnderstandScene";
import { VerifyScene } from "@/components/landing/VerifyScene";
import { ActScene } from "@/components/landing/ActScene";
import { CompareScene } from "@/components/landing/CompareScene";
import { useSceneScroll } from "@/lib/hooks/useSceneScroll";

describe("Landing Scenes Hydration & Deterministic Initial State", () => {
  describe("1. SSR Determinism (Server Render without window)", () => {
    it("renders UnderstandScene with deterministic pure-CSS container and progress 0", () => {
      const html = renderToString(React.createElement(UnderstandScene));

      // Container has static pure CSS height classes
      expect(html).toContain("relative h-auto py-14 sm:py-20 lg:h-[220vh]");
      expect(html).toContain("lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden");

      // Clause 9.1 opacity is 1 - 0*0.7 = 1 (not 0.3 which was the SSR bug)
      expect(html).toContain("opacity:1");
      expect(html).not.toContain("opacity:0.3");
      expect(html).not.toContain("opacity: 0.3");

      // "Critical Friction" badge is NOT shown at progress 0 (highlightProgress > 0.4 is false)
      expect(html).not.toContain("Critical Friction");
    });

    it("renders VerifyScene with deterministic pure-CSS container and progress 0", () => {
      const html = renderToString(React.createElement(VerifyScene));

      expect(html).toContain("relative h-auto py-14 sm:py-20 lg:h-[240vh]");
      expect(html).toContain("lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden");
      // Node 1 initial opacity at progress 0 is 0
      expect(html).toContain("opacity:0");
    });

    it("renders ActScene with deterministic pure-CSS container and progress 0", () => {
      const html = renderToString(React.createElement(ActScene));

      expect(html).toContain("relative h-auto py-14 sm:py-20 lg:h-[200vh]");
      expect(html).toContain("lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden");
      // Checklist item 1 initial opacity at progress 0 is 0
      expect(html).toContain("opacity:0");
    });

    it("renders CompareScene with deterministic pure-CSS container and progress 0", () => {
      const html = renderToString(React.createElement(CompareScene));

      expect(html).toContain("relative h-auto py-14 sm:py-20 lg:h-[200vh]");
      expect(html).toContain("lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden");
      // slideProgress at progress 0 is 0, opacity is 0.4 + 0*0.6 = 0.4
      expect(html).toContain("opacity:0.4");
    });
  });

  describe("2. First Client Render Determinism vs SSR (No Hydration Mismatch)", () => {
    it("produces identical HTML whether window exists or not on initial render pass", () => {
      // 1. Render in simulated SSR (no window)
      const ssrUnderstand = renderToString(React.createElement(UnderstandScene));
      const ssrCompare = renderToString(React.createElement(CompareScene));

      // 2. Simulate client environment with desktop window
      vi.stubGlobal("window", {
        innerWidth: 1440,
        innerHeight: 900,
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      // In initial render pass (before useEffect runs), the hook state is strictly initial:
      const clientInitialUnderstand = renderToString(React.createElement(UnderstandScene));
      const clientInitialCompare = renderToString(React.createElement(CompareScene));

      // Must be 100% byte-for-byte identical!
      expect(clientInitialUnderstand).toBe(ssrUnderstand);
      expect(clientInitialCompare).toBe(ssrCompare);

      vi.unstubAllGlobals();
    });

    it("produces identical HTML even if client is a mobile device on initial render pass", () => {
      const ssrUnderstand = renderToString(React.createElement(UnderstandScene));

      // Simulate client mobile phone (iPhone / Pixel)
      vi.stubGlobal("window", {
        innerWidth: 390,
        innerHeight: 844,
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const clientInitialUnderstand = renderToString(React.createElement(UnderstandScene));
      expect(clientInitialUnderstand).toBe(ssrUnderstand);

      vi.unstubAllGlobals();
    });
  });

  describe("3. useSceneScroll Initial Hook State Contract", () => {
    it("initializes synchronously to [ref, progress=0, reducedMotion=false, isDesktop=true] on first render", () => {
      let hookOutput: ReturnType<typeof useSceneScroll> | null = null;

      function TestComponent() {
        hookOutput = useSceneScroll();
        return React.createElement("div", { ref: hookOutput[0] });
      }

      renderToString(React.createElement(TestComponent));

      expect(hookOutput).not.toBeNull();
      const [, progress, reducedMotion, isDesktop] = hookOutput!;
      expect(progress).toBe(0.0);
      expect(reducedMotion).toBe(false);
      expect(isDesktop).toBe(true);
    });
  });
});
